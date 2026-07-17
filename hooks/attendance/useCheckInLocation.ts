import { useState, useCallback, useRef } from 'react';
import { calculateDistance } from '../../lib/locationUtils';
import { LocationDef, WorkLocation } from '../../types/attendance';

export interface LocationState {
    status: 'LOADING' | 'SUCCESS' | 'ERROR';
    lat: number;
    lng: number;
    matchedLocation?: LocationDef;
    distance?: number;
}

export const useCheckInLocation = (targets: LocationDef[]) => {
    const [locationState, setLocationState] = useState<LocationState>({
        status: 'LOADING',
        lat: 0,
        lng: 0,
    });
    const [detectedMatches, setDetectedMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [isGpsSecure, setIsGpsSecure] = useState(true);
    const [gpsThreatReason, setGpsThreatReason] = useState<string>('');

    // To check static coordinates (No Jitter)
    const lastCoordinatesRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
    const motionSamplesRef = useRef<{ x: number; y: number; z: number }[]>([]);
    const orientationSamplesRef = useRef<{ alpha: number; beta: number; gamma: number }[]>([]);

    const checkLocation = useCallback((
        onMatch: (matches: any[], primaryMatch: any) => void,
        onNoMatch: (minDistance: number) => void
    ) => {
        setLocationState({ status: 'LOADING', lat: 0, lng: 0 });
        if (!navigator.geolocation) {
            setLocationState({ status: 'ERROR', lat: 0, lng: 0 });
            return;
        }

        // Reset motion sample collections
        motionSamplesRef.current = [];
        orientationSamplesRef.current = [];

        const handleMotion = (event: DeviceMotionEvent) => {
            const acc = event.acceleration || event.accelerationIncludingGravity;
            if (acc) {
                motionSamplesRef.current.push({
                    x: acc.x ?? 0,
                    y: acc.y ?? 0,
                    z: acc.z ?? 0,
                });
            }
        };

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
                orientationSamplesRef.current.push({
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma,
                });
            }
        };

        // Standard iOS & general permissions checking for device motion/orientation
        const attachListeners = () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                (DeviceOrientationEvent as any).requestPermission()
                    .then((state: string) => {
                        if (state === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation);
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }

            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                (DeviceMotionEvent as any).requestPermission()
                    .then((state: string) => {
                        if (state === 'granted') {
                            window.addEventListener('devicemotion', handleMotion);
                        }
                    })
                    .catch(console.error);
            } else {
                window.addEventListener('devicemotion', handleMotion);
            }
        };

        const detachListeners = () => {
            window.removeEventListener('devicemotion', handleMotion);
            window.removeEventListener('deviceorientation', handleOrientation);
        };

        attachListeners();

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                detachListeners();
                const { latitude, longitude, accuracy } = pos.coords;
                const now = Date.now();

                let secure = true;
                let threat = '';

                // 1. Webdriver / Automation checks (Puppeteer, Selenium, Chrome CDP)
                if (navigator.webdriver) {
                    secure = false;
                    threat = 'ตรวจพบระบบทำงานบนสภาพแวดล้อมจำลอง (Automation Webdriver Detected)';
                }

                // 2. Zero / Impossible Accuracy checks
                if (accuracy === 0) {
                    secure = false;
                    threat = 'พิกัดไม่มีความคลาดเคลื่อน (Accuracy 0) ซึ่งเป็นลักษณะเด่นของแอป Fake GPS';
                } else if (accuracy > 0 && accuracy < 0.1) {
                    secure = false;
                    threat = 'ความละเอียดพิกัดสูงผิดปกติระดับเซนติเมตร (Accuracy < 0.1m) ซึ่งผิดธรรมชาติของ Web Geolocation';
                }

                // 3. High Inaccuracy / VPN Proxy Spoofing
                if (accuracy > 3000) {
                    secure = false;
                    threat = 'ความคลาดเคลื่อนของพิกัดสูงเกิน 3 กิโลเมตร อาจเนื่องมาจากการหลอกพิกัดผ่าน VPN/Proxy/IP หรือสัญญาณถูกรบกวนอย่างรุนแรง';
                }

                // 4. Teleportation (Fast Jumping) Detection
                try {
                    const lastGpsStr = localStorage.getItem('last_gps_checkpoint');
                    if (lastGpsStr) {
                        const prevLoc = JSON.parse(lastGpsStr);
                        const timeDiffSeconds = (now - prevLoc.timestamp) / 1000;
                        if (timeDiffSeconds > 0 && timeDiffSeconds < 120) { // Check jumps within 2 minutes
                            const dist = calculateDistance(latitude, longitude, prevLoc.lat, prevLoc.lng);
                            const speed = dist / timeDiffSeconds; // meters per second
                            
                            // Speed limit: > 150 m/s (540 km/h) and moved more than 500 meters is physically impossible for normal check-ins
                            if (dist > 500 && speed > 150) {
                                secure = false;
                                threat = `ตรวจพบการเปลี่ยนตำแหน่งรวดเร็วผิดธรรมชาติ (Teleportation): ระยะทาง ${dist.toFixed(0)} ม. ภายในเวลาเพียง ${timeDiffSeconds.toFixed(1)} วินาที`;
                            }
                        }
                    }
                    localStorage.setItem('last_gps_checkpoint', JSON.stringify({ lat: latitude, lng: longitude, timestamp: now }));
                } catch (e) {
                    console.error('Error verifying teleportation', e);
                }

                // 5. Static No-Jitter Check (If position is requested repeatedly and is 100% identical)
                if (lastCoordinatesRef.current) {
                    const prev = lastCoordinatesRef.current;
                    const timeDiff = now - prev.time;
                    if (timeDiff < 30000) { // within 30 seconds
                        if (prev.lat === latitude && prev.lng === longitude) {
                            // Perfect match on repeating reads might indicate static spoofing mock providers
                            // Note: We flag this if it's identical down to the last decimal place (typically 15-16 decimals in JS floating point)
                            // In real physical hardware, thermal noise and orbital shifts always cause slight micro-movements (jitter) in GPS.
                            const decimalStringLat = latitude.toString().split('.')[1] || '';
                            const decimalStringLng = longitude.toString().split('.')[1] || '';
                            if (decimalStringLat.length > 7 && decimalStringLng.length > 7) {
                                // Real devices normally fluctuate slightly. Static mock apps return exactly identical floating values.
                                secure = false;
                                threat = 'ตรวจพบพิกัดนิ่งสนิทไม่มีคลื่นรบกวนตามธรรมชาติ (Static Mock Location Provider Detected)';
                            }
                        }
                    }
                }

                // 6. Device Orientation / Motion Sensor check
                try {
                    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobileDevice) {
                        const mSamples = motionSamplesRef.current;
                        
                        // We only perform statistical analysis if we have gathered some samples
                        if (mSamples.length >= 3) {
                            const calculateVariance = (values: number[]) => {
                                if (values.length === 0) return 0;
                                const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
                                return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
                            };

                            const varX = calculateVariance(mSamples.map(s => s.x));
                            const varY = calculateVariance(mSamples.map(s => s.y));
                            const varZ = calculateVariance(mSamples.map(s => s.z));
                            const totalVariance = varX + varY + varZ;

                            // GPS changed check: Compare current coordinates with previous
                            let gpsChangedDist = 0;
                            if (lastCoordinatesRef.current) {
                                gpsChangedDist = calculateDistance(latitude, longitude, lastCoordinatesRef.current.lat, lastCoordinatesRef.current.lng);
                            }

                            // If total variance is absolute zero (exactly 0.0), it suggests simulated device or static emulator sensor readings
                            if (totalVariance === 0) {
                                secure = false;
                                threat = 'ตรวจพบการจำลองเซ็นเซอร์ความเคลื่อนไหว (Static Motion Sensor Detected): อุปกรณ์ไม่มีการสั่นไหวระดับไมโครตามธรรมชาติ';
                            } else if (gpsChangedDist > 5 && totalVariance < 0.00001) {
                                // GPS moved, but the accelerometer/gyroscope is completely static
                                secure = false;
                                threat = `ตรวจพบการปลอมแปลงเส้นทางวิ่ง (Route Simulation Detected): พิกัด GPS เคลื่อนที่ ${gpsChangedDist.toFixed(1)} ม. แต่โทรศัพท์นิ่งสนิทและไม่มีความเคลื่อนไหวทางกายภาพ`;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error analyzing motion sensors', e);
                }

                // 7. Capacitor / Native Wrapper deep mock checks (PWA to Native transition)
                try {
                    const cap = (window as any).Capacitor;
                    if (cap) {
                        // Support native mock location injection
                        if ((window as any).isMockLocation === true || (window as any).isMockGps === true) {
                            secure = false;
                            threat = 'ตรวจพบการจำลองพิกัดผ่านระบบปฏิบัติการระดับลึก (Native Mock Provider Detected)';
                        }
                        
                        // Support custom native bridge or Capacitor plugin check
                        if ((window as any).nativeMockDetected === true) {
                            secure = false;
                            threat = 'ระบบตรวจพบแอปพลิเคชันสวมสิทธิ์การระบุตำแหน่งจำลองระดับเครื่อง (Native Emulator Mocking)';
                        }
                    }
                } catch (e) {
                    console.error('Error verifying native wrapper mock signals', e);
                }

                lastCoordinatesRef.current = { lat: latitude, lng: longitude, time: now };

                setIsGpsSecure(secure);
                setGpsThreatReason(threat);

                const matches: any[] = [];
                let minDistance = Infinity;

                for (const loc of targets) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    if (dist < minDistance) {
                        minDistance = dist;
                    }
                    if (dist <= loc.radiusMeters) {
                        matches.push({
                            ...loc,
                            distance: dist,
                        });
                    }
                }

                // Sort matches with closest first
                matches.sort((a, b) => a.distance - b.distance);

                if (matches.length > 0) {
                    const primaryMatch = matches[0];
                    setDetectedMatches(matches);
                    setSelectedMatch(primaryMatch);

                    setLocationState({
                        status: 'SUCCESS',
                        lat: latitude,
                        lng: longitude,
                        matchedLocation: primaryMatch,
                        distance: primaryMatch.distance,
                    });

                    // Even if matches, we only trigger callback if it's GPS secure
                    // Actually, let's let the modal handle blocking so we can display threats to user
                    onMatch(matches, primaryMatch);
                } else {
                    setDetectedMatches([]);
                    setSelectedMatch(null);

                    setLocationState({
                        status: 'SUCCESS',
                        lat: latitude,
                        lng: longitude,
                        matchedLocation: undefined,
                        distance: minDistance,
                    });

                    onNoMatch(minDistance);
                }
            },
            (err) => {
                console.error(err);
                setLocationState({ status: 'ERROR', lat: 0, lng: 0 });
                setIsGpsSecure(false);
                setGpsThreatReason('ไม่สามารถเข้าถึงเซ็นเซอร์พิกัดของอุปกรณ์ หรือผู้ใช้ไม่อนุญาตสิทธิ์การระบุตำแหน่ง');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [targets]);

    return {
        locationState,
        setLocationState,
        detectedMatches,
        setDetectedMatches,
        selectedMatch,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        checkLocation,
    };
};
