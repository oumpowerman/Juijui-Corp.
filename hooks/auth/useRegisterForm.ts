import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import heic2any from 'heic2any';
import { BRAND_CONFIG } from '../../config/brand';
import { EMOJI_POOL, DEFAULT_EMOJI } from '../../constants/emojis';
import { useCompanies } from '../useCompanies';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

export interface UseRegisterFormOptions {
  onRegisterSuccess: () => void;
  onSessionLoginSuccess: () => void;
}

export function useRegisterForm({
  onRegisterSuccess,
  onSessionLoginSuccess,
}: UseRegisterFormOptions) {
  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [companyId, setCompanyId] = useState('');

  // Master positions options & Companies
  const { activeCompanies: companies } = useCompanies();
  const [positions, setPositions] = useState<{ key: string; label: string }[]>([]);

  // Emoji states
  const [takenEmojis, setTakenEmojis] = useState<string[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState(DEFAULT_EMOJI);

  // Avatar upload states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isConvertingImg, setIsConvertingImg] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useGlobalDialog();

  // Initialize companyId default
  useEffect(() => {
    if (!companyId && companies.length > 0) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  // Load positions
  useEffect(() => {
    const fetchPositions = async () => {
      const { data } = await supabase
        .from('master_options')
        .select('key, label')
        .eq('type', 'POSITION')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      let loadedPositions: { key: string; label: string }[] = [];
      if (data && data.length > 0) {
        loadedPositions = data.filter(
          (p) => !['CEO', 'HR_MANAGER', 'SENIOR_HR'].includes(p.key)
        );
      } else {
        loadedPositions = [
          { key: 'CREATIVE', label: 'Creative' },
          { key: 'EDITOR', label: 'Editor' },
          { key: 'PRODUCTION', label: 'Production' },
          { key: 'ADMIN', label: 'Admin / Co-ord' },
        ];
      }
      loadedPositions.push({ key: 'OTHER', label: 'อื่นๆ (ใส่ตำแหน่งทีหลัง)' });
      setPositions(loadedPositions);
    };
    fetchPositions();
  }, []);

  // Fetch taken emojis
  const fetchTakenEmojis = async () => {
    try {
      const { data } = await supabase.from('profiles').select('emoji');
      if (data) {
        const emojis = data.map((p) => p.emoji).filter(Boolean);
        setTakenEmojis(emojis);
        const firstAvailable = EMOJI_POOL.find((e) => !emojis.includes(e));
        if (firstAvailable) {
          setSelectedEmoji(firstAvailable);
        }
      }
    } catch (e) {
      console.error('Error fetching taken emojis:', e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];

      // Image format validation & conversion for HEIC files
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        setIsConvertingImg(true);
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8,
          });

          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
            type: 'image/jpeg',
          });
        } catch (err) {
          console.error('HEIC Conversion error:', err);
          setErrorMsg('ไม่สามารถแปลงไฟล์รูปภาพได้ กรุณาลองใช้รูปอื่น');
          setIsConvertingImg(false);
          return;
        } finally {
          setIsConvertingImg(false);
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(objectUrl);
    setCropImageSrc(null);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setName('');
    setFirstName('');
    setLastName('');
    setPosition('');
    setEmploymentType('');
    setPhone('');
    setReason('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrorMsg(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const cleanUsername = username.toLowerCase().trim();
      if (!cleanUsername) {
        throw new Error('กรุณากรอกชื่อผู้ใช้นะครับ');
      }
      if (!/^[a-z0-9_.]{3,20}$/.test(cleanUsername)) {
        throw new Error(
          'ชื่อผู้ใช้ต้องประกอบด้วยภาษาอังกฤษ ตัวเลข ขีดล่าง (_) และจุด (.) ความยาว 3-20 ตัวอักษรเท่านั้นนะครับ'
        );
      }

      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !name.trim() ||
        !position.trim() ||
        !phone.trim() ||
        !employmentType
      ) {
        throw new Error('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย * นะครับ');
      }
      if (!selectedEmoji) {
        throw new Error('กรุณาเลือกอิโมจิประจำตัวของคุณด้วยนะครับ 👾');
      }
      if (takenEmojis.includes(selectedEmoji)) {
        throw new Error('อิโมจินี้ถูกเพื่อนในทีมเลือกไปแล้วครับ โปรดเลือกอิโมจิอื่นนะ ✨');
      }

      // Check if username is taken in profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        throw new Error('ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาเลือกชื่อผู้ใช้อื่นนะครับ');
      }

      const cleanEmail = email.trim() ? email.toLowerCase().trim() : '';
      const finalAuthEmail = cleanEmail ? cleanEmail : `${cleanUsername}@juijui-app.com`;

      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Create new user credentials
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalAuthEmail,
        password,
        options: {
          data: {
            full_name: fullNameCombined || name,
            position: position,
            phone_number: phone,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');

      const userId = authData.user.id;
      let publicUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        // Upload profile image safely to Storage bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message);

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // Upsert customized user details
      const finalCompanyId = companyId || (companies.length > 0 ? companies[0].id : null);

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: cleanEmail || null,
        username: cleanUsername,
        full_name: fullNameCombined || name,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: name.trim(),
        avatar_url: publicUrl || null,
        position: position,
        employment_type: employmentType,
        start_date: new Date().toISOString(),
        phone_number: phone,
        bio: reason,
        company_id: finalCompanyId,
        role: 'MEMBER',
        work_days: [1, 2, 3, 4, 5],
        hp: BRAND_CONFIG.initialHpMode === 2 ? 0 : 100,
        max_hp: 100,
        xp: 0,
        level: 1,
        available_points: 0,
        death_count: 0,
        emoji: selectedEmoji,
      });

      if (profileError) throw profileError;

      if (authData.session) {
        onSessionLoginSuccess();
      } else {
        onRegisterSuccess();
      }
    } catch (err: any) {
      const message = err.message || 'เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่อีกครั้งครับ';

      // Auto-scroll to the error field and focus
      if (message.includes('ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว') || message.includes('ชื่อผู้ใช้')) {
        const usernameContainer = document.getElementById('register-username-container');
        if (usernameContainer) {
          usernameContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const input = usernameContainer.querySelector('input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
          }, 350);
        }
      } else if (message.includes('อิโมจิ')) {
        const emojiContainer = document.getElementById('register-selectedEmoji-container');
        if (emojiContainer) {
          emojiContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (
        message.includes('รูปภาพ') ||
        message.includes('รูปโปรไฟล์') ||
        message.includes('อัปโหลดรูป')
      ) {
        const avatarContainer = document.getElementById('register-avatarPreview-container');
        if (avatarContainer) {
          avatarContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      await showAlert(message, 'ไม่สามารถสมัครสมาชิกได้');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    name,
    setName,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    position,
    setPosition,
    employmentType,
    setEmploymentType,
    phone,
    setPhone,
    reason,
    setReason,
    companyId,
    setCompanyId,
    companies,
    positions,
    takenEmojis,
    selectedEmoji,
    setSelectedEmoji,
    avatarPreview,
    isConvertingImg,
    cropImageSrc,
    setCropImageSrc,
    fileInputRef,
    isLoading,
    errorMsg,
    setErrorMsg,
    fetchTakenEmojis,
    handleFileChange,
    handleCropComplete,
    handleRegisterSubmit,
    resetForm,
  };
}

export default useRegisterForm;
