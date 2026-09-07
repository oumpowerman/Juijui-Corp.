import React from 'react';
import SuccessModal from '../../SuccessModal';

export interface RegistrationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUpdate?: boolean;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  onClose,
  isUpdate = false,
}) => {
  return (
    <SuccessModal
      isOpen={isOpen}
      onClose={onClose}
      title={isUpdate ? 'เปลี่ยนรหัสผ่านสำเร็จ! 🔐' : 'ส่งใบสมัครแล้ว! 🎉'}
      description={
        isUpdate ? (
          <>
            รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว <br />
            <span className="text-gray-500 text-sm">
              คุณสามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้ทันที
            </span>
          </>
        ) : (
          <>
            เย้! เราได้รับข้อมูลของคุณแล้ว <br />
            <span className="text-gray-500 text-sm">
              พี่ Admin จะรีบตรวจความถูกต้องและอนุมัติให้โดยไว
            </span>
            <br />
            <span className="text-pink-500 font-bold text-lg mt-2 block">
              รอก่อนนะคร้าบ!
            </span>
          </>
        )
      }
      buttonText={isUpdate ? 'ไปหน้าล็อกอิน' : 'กลับไปหน้าล็อกอิน'}
    />
  );
};

export default RegistrationSuccessModal;
