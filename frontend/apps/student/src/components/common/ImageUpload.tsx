import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (dataUrlOrLink: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'avatar';
  maxSizeMB?: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Rasm yuklash',
  helperText = 'PNG, JPG, WebP yoki GIF (maksimal 5MB)',
  aspectRatio = 'square',
  maxSizeMB = 5,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeText, setFileSizeText] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Faqat rasm fayllarini yuklash mumkin (PNG, JPG, WebP, GIF)');
      return;
    }

    // Validate size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(`Rasm hajmi juda katta! Maksimal hajm: ${maxSizeMB}MB`);
      return;
    }

    // Calculate readable size
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${sizeInKb} KB`;

    setFileName(file.name);
    setFileSizeText(sizeFormatted);

    // Read as Data URL with canvas compression
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      // Compress and resize image client-side to ensure fast loading and prevent storage overflow
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = aspectRatio === 'avatar' ? 400 : 900;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            onChange(compressed);
          } else {
            onChange(dataUrl);
          }
        } catch {
          onChange(dataUrl);
        }
      };
      img.onerror = () => {
        onChange(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setErrorMessage('Faylni o‘qishda xatolik yuz berdi');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileName(null);
    setFileSizeText(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  const aspectClasses = {
    square: 'h-40',
    avatar: 'h-28 w-28 rounded-full',
    video: 'h-48 aspect-video',
    wide: 'h-36 w-full'
  }[aspectRatio];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#5C42FD] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Fayl yuklashga qaytish' : 'URL orqali kiritish'}</span>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {showUrlInput ? (
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-[#F8F8FC] border border-gray-200 focus:border-[#5C42FD] focus:bg-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-hidden transition-all font-mono"
            />
          </div>
          {value && (
            <div className="flex items-center gap-3 p-2 bg-[#FAF9FE] rounded-xl border border-gray-100">
              <img
                src={value}
                alt="URL Preview"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                onError={() => setErrorMessage('Rasm URL manzili orqali ochilmadi')}
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-semibold text-gray-900 truncate">URL orqali biriktirilgan rasm</p>
                <p className="text-[10px] text-gray-400 truncate">{value}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                title="Tozalash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            /* Uploaded Image Preview Box */
            <div className="border border-[#E9EAF3] rounded-2xl p-3.5 bg-[#FAF9FE] shadow-2xs">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={value}
                    alt="Yuklangan rasm"
                    className={`object-cover rounded-xl border border-gray-200 shadow-xs max-h-32 ${
                      aspectRatio === 'avatar' ? 'w-24 h-24 rounded-full' : 'w-28 h-28'
                    }`}
                  />
                  <div
                    onClick={triggerPicker}
                    className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>O‘zgartirish</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left space-y-1.5 w-full">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Rasm kompyuterdan muvaffaqiyatli yuklandi</span>
                  </div>

                  {fileName && (
                    <p className="text-xs font-mono text-gray-800 font-semibold truncate">
                      {fileName}
                    </p>
                  )}
                  {fileSizeText && (
                    <p className="text-[11px] text-gray-500">
                      Hajmi: <span className="font-semibold text-gray-700">{fileSizeText}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={triggerPicker}
                      className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#5C42FD]" />
                      <span>Boshqa rasm tanlash</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O‘chirish</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerPicker}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer bg-white group ${
                isDragging
                  ? 'border-[#5C42FD] bg-[#5C42FD]/5 ring-4 ring-[#5C42FD]/10'
                  : 'border-[#E0E2EC] hover:border-[#5C42FD] hover:bg-[#FAF9FE]'
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#5C42FD]/10 text-[#5C42FD] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#5C42FD] transition-colors">
                    Kompyuterdan rasm yuklash uchun bu yerni bosing
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    yoki faylni shu yerga sudrab tashlang (Drag & Drop)
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                  <ImageIcon className="w-3 h-3" />
                  <span>{helperText}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
