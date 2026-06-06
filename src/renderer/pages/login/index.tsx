import loginLogo from '@renderer/assets/logo-contained.svg';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/renderer/services/i18n';
import { LANGUAGE_OPTIONS } from '@/common/config/i18n';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, Select } from '@arco-design/web-react';
import type { RefInputType } from '@arco-design/web-react/es/Input/interface';
import { Lock, User } from 'lucide-react';
import AppLoader from '@renderer/components/layout/AppLoader';
import { useAuth } from '../../hooks/context/AuthContext';
import styles from './LoginPage.module.css';

type MessageState = {
  type: 'error' | 'success';
  text: string;
};

const REMEMBER_ME_KEY = 'rememberMe';
const REMEMBERED_USERNAME_KEY = 'rememberedUsername';
const REMEMBERED_PASSWORD_KEY = 'rememberedPassword';

// Simple obfuscation for stored credentials (not cryptographically secure, but prevents plain text storage)
const obfuscate = (text: string): string => {
  const encoded = btoa(encodeURIComponent(text));
  return encoded.split('').toReversed().join('');
};

const deobfuscate = (text: string): string => {
  try {
    const reversed = text.split('').toReversed().join('');
    return decodeURIComponent(atob(reversed));
  } catch {
    return '';
  }
};

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef<RefInputType | null>(null);
  const messageTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    document.title = t('login.pageTitle');
  }, [t]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const isRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (isRememberMe) {
      const storedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY);
      const storedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY);
      if (storedUsername) setUsername(deobfuscate(storedUsername));
      if (storedPassword) setPassword(deobfuscate(storedPassword));
      setRememberMe(true);
    }
    window.setTimeout(() => {
      usernameRef.current?.focus();
    }, 0);

    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      void navigate('/guid', { replace: true });
    }
  }, [navigate, status]);

  const clearMessageLater = useCallback(() => {
    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
    }
    messageTimer.current = window.setTimeout(() => {
      setMessage((prev) => (prev?.type === 'success' ? prev : null));
    }, 5000);
  }, []);

  const showMessage = useCallback(
    (next: MessageState) => {
      setMessage(next);
      if (next.type === 'error') {
        clearMessageLater();
      }
    },
    [clearMessageLater]
  );

  const supportedLanguages = LANGUAGE_OPTIONS;

  const handleLanguageChange = useCallback((nextLanguage: string) => {
    changeLanguage(nextLanguage).catch((error: Error) => {
      console.error('Failed to change language:', error);
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmedUsername = username.trim();

      if (!trimmedUsername || !password) {
        showMessage({ type: 'error', text: t('login.errors.empty') });
        return;
      }

      setLoading(true);
      setMessage(null);

      const result = await login({ username: trimmedUsername, password, remember: rememberMe });

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
          localStorage.setItem(REMEMBERED_USERNAME_KEY, obfuscate(trimmedUsername));
          localStorage.setItem(REMEMBERED_PASSWORD_KEY, obfuscate(password));
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBERED_USERNAME_KEY);
          localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
        }

        const successText = t('login.success');
        showMessage({ type: 'success', text: successText });

        window.setTimeout(() => {
          void navigate('/guid', { replace: true });
        }, 600);
      } else {
        const errorText = (() => {
          switch (result.code) {
            case 'invalidCredentials':
              return t('login.errors.invalidCredentials');
            case 'tooManyAttempts':
              return t('login.errors.tooManyAttempts');
            case 'networkError':
              return t('login.errors.networkError');
            case 'serverError':
              return t('login.errors.serverError');
            case 'unknown':
            default:
              return result.message ?? t('login.errors.unknown');
          }
        })();

        showMessage({ type: 'error', text: errorText });
      }

      setLoading(false);
    },
    [login, navigate, password, rememberMe, showMessage, t, username]
  );

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className={styles['login-page']}>
      <div className={styles['login-page__card']}>
        <label className={styles['login-page__lang-select-wrapper']} htmlFor='lang-select'>
          <Select
            id='lang-select'
            className={styles['login-page__lang-select']}
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            {supportedLanguages.map((lang) => (
              <Select.Option key={lang.code} value={lang.code}>
                {lang.label}
              </Select.Option>
            ))}
          </Select>
        </label>

        <div className={styles['login-page__header']}>
          <div className={styles['login-page__brand-row']}>
            <div className={styles['login-page__logo']}>
              <img src={loginLogo} alt={t('login.brand')} />
            </div>
            <h1 className={styles['login-page__title']}>{t('login.brand')}</h1>
          </div>
          <p className={styles['login-page__subtitle']}>{t('login.subtitle')}</p>
        </div>

        <form className={styles['login-page__form']} onSubmit={handleSubmit}>
          <div className={styles['login-page__form-item']}>
            <label className={styles['login-page__label']} htmlFor='username'>
              {t('login.username')}
            </label>
            <div className={styles['login-page__input-wrapper']}>
              <Input
                ref={usernameRef}
                id='username'
                name='username'
                className={styles['login-page__input']}
                placeholder={t('login.usernamePlaceholder')}
                autoComplete='username'
                value={username}
                onChange={(value) => setUsername(value)}
                aria-required='true'
                prefix={<User size={16} />}
              />
            </div>
          </div>

          <div className={styles['login-page__form-item']}>
            <label className={styles['login-page__label']} htmlFor='password'>
              {t('login.password')}
            </label>
            <div className={styles['login-page__input-wrapper']}>
              <Input.Password
                id='password'
                name='password'
                className={styles['login-page__input']}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete='current-password'
                value={password}
                onChange={(value) => setPassword(value)}
                aria-required='true'
                prefix={<Lock size={16} />}
              />
            </div>
          </div>

          <div className={styles['login-page__checkbox']}>
            <Checkbox id='remember-me' checked={rememberMe} onChange={(checked) => setRememberMe(checked)}>
              {t('login.rememberMe')}
            </Checkbox>
          </div>

          <Button
            type='primary'
            htmlType='submit'
            className={styles['login-page__submit']}
            disabled={loading}
            loading={loading}
          >
            <span>{loading ? t('login.submitting') : t('login.submit')}</span>
          </Button>

          <div
            role='alert'
            aria-live='polite'
            className={`${styles['login-page__message']} ${message ? styles['login-page__message--visible'] : ''} ${message ? (message.type === 'success' ? styles['login-page__message--success'] : styles['login-page__message--error']) : ''}`}
            hidden={!message}
          >
            {message?.text}
          </div>
        </form>

        <div className={styles['login-page__footer']}>
          <div className={styles['login-page__footer-content']}>
            <span>{t('login.footerPrimary')}</span>
            <span className={styles['login-page__footer-divider']}>•</span>
            <span>{t('login.footerSecondary')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
