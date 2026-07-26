import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch } from '@/app/store/hooks';
import { setCredentials } from '@/features/auth/model/authSlice';

interface LoginFields { username: string; password: string; rememberMe: boolean; }
interface LoginPanelProps { onRegister: () => void; }
const DEMO_LOGIN = { username: 'pirate_demo', password: 'demo@2026' };

export function PlayerLoginPanel({ onRegister }: LoginPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({ defaultValues: { username: '', password: '', rememberMe: false } });

  async function submit(data: LoginFields) {
    setAuthError(null); setLoading(true); await new Promise((resolve) => setTimeout(resolve, 900));
    if (data.username === DEMO_LOGIN.username && data.password === DEMO_LOGIN.password) {
      dispatch(setCredentials({ accessToken: 'demo-access-token', user: { id: '1', email: 'pirate_demo@local', name: data.username, role: 'user' } }));
      toast.success('Đăng nhập thành công! Chào mừng trở lại.');
      navigate('/user-account');
    } else { setAuthError('Thông tin đăng nhập không đúng · dùng tài khoản demo bên dưới để thử.'); }
    setLoading(false);
  }

  return <form onSubmit={handleSubmit(submit)} className='flex flex-col gap-5' noValidate><div><h2 className='mb-1 text-xl font-700 text-foreground'>Đăng Nhập</h2><p className='text-sm text-muted-foreground'>Nhập thông tin tài khoản để tiếp tục</p></div>{authError && <div className='flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3'><AlertCircle size={16} className='mt-0.5 shrink-0 text-red-light' /><p className='text-sm text-red-light'>{authError}</p></div>}<div><label className='mb-1.5 block text-sm font-600 text-foreground'>Tên Tài Khoản</label><input type='text' placeholder='Nhập tên tài khoản...' className={`input-field ${errors.username ? 'border-red-light' : ''}`} {...register('username', { required: 'Vui lòng nhập tên tài khoản', minLength: { value: 4, message: 'Tên tài khoản phải có ít nhất 4 ký tự' }, pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Chỉ chấp nhận chữ, số và dấu gạch dưới' } })} />{errors.username && <p className='mt-1.5 flex items-center gap-1 text-xs text-red-light'><AlertCircle size={12} />{errors.username.message}</p>}</div><div><label className='mb-1.5 block text-sm font-600 text-foreground'>Mật Khẩu</label><div className='relative'><input type={showPassword ? 'text' : 'password'} placeholder='Nhập mật khẩu...' className={`input-field pr-10 ${errors.password ? 'border-red-light' : ''}`} {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' } })} /><button type='button' onClick={() => setShowPassword((value) => !value)} className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground' aria-label='Hiện hoặc ẩn mật khẩu'>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p className='mt-1.5 flex items-center gap-1 text-xs text-red-light'><AlertCircle size={12} />{errors.password.message}</p>}</div><div className='flex items-center gap-2'><input type='checkbox' id='rememberMe' className='h-4 w-4 accent-primary' {...register('rememberMe')} /><label htmlFor='rememberMe' className='cursor-pointer select-none text-sm text-muted-foreground'>Ghi nhớ đăng nhập</label></div><button type='submit' disabled={loading} className='btn-primary mt-1 flex min-h-12 w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-60'>{loading ? <Loader2 size={18} className='animate-spin' /> : <><LogIn size={18} />Đăng Nhập</>}</button><p className='text-center text-sm text-muted-foreground'>Chưa có tài khoản? <button type='button' onClick={onRegister} className='font-600 text-gold hover:text-gold-light'>Đăng ký ngay</button></p></form>;
}

export { DEMO_LOGIN };
