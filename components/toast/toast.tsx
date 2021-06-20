import { useHover } from '@hooks/use-hover/use-hover';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ToastFactoryPayload,
  ToastPayload,
  ToastProps,
} from './toast.interface';
import styles from './toast.module.css';

interface ToastContainerProps {
  notify: (methods: ToastFactoryPayload) => void;
}

function generateRandomId() {
  return Math.floor(Math.random() * Date.now());
}

export function ToastContainer({ notify }: ToastContainerProps) {
  const [messages, setMessages] = useState<ToastPayload[]>([]);

  const add = (message: string) => {
    setMessages((currentMessages: ToastPayload[]) => [
      ...currentMessages,
      { id: generateRandomId(), message },
    ]);
  };

  const close = useCallback((toastId: number) => {
    setMessages((dt: ToastPayload[]) => dt.filter(({ id }) => toastId !== id));
  }, []);

  const closeAll = () => setMessages([]);

  useEffect(() => {
    notify({
      add,
      close,
      closeAll
    });
  }, [notify, close]);

  return (
    <div className="fixed right-3 top-3 space-y-2 z-[9999]">
      {messages.map((dt: ToastPayload) => (
        <Toast key={dt.id} payload={dt} onClose={close} />
      ))}
    </div>
  );
}

export function Toast({
  payload: { id, message },
  onClose,
  delay = 1500,
}: ToastProps) {
  const timeoutRef = useRef(null);
  const elementRef = useRef<HTMLDivElement>();
  const isHovering = useHover(elementRef);

  useLayoutEffect(() => {
    if (timeoutRef.current && isHovering) {
      clearTimeout(timeoutRef.current);
    } else {
      const node = elementRef.current;
      node.className += ` ${styles.enter}`;

      timeoutRef.current = setTimeout(() => {
        node.className += ` ${styles.leave}`;

        const listener = () => {
          node.removeEventListener('animationend', listener);
          onClose(id);
        };

        node.addEventListener('animationend', listener);
      }, delay);
    }

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [id, delay, onClose, isHovering]);

  return (
    <div
      ref={elementRef}
      className={`rounded-md bg-blue-400 border border-blue-600 p-3`}
    >
      <div className="flex justify-between items-center space-x-5">
        <span>{message}</span>
        <span onClick={() => onClose(id)} className="hover:cursor-pointer">
          <svg
            aria-hidden="true"
            viewBox="0 0 14 16"
            className="h-[16px] w-[14px] fill-current"
          >
            <path
              fillRule="evenodd"
              d="M7.71 8.23l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75L1 11.98l3.75-3.75L1 4.48 2.48 3l3.75 3.75L9.98 3l1.48 1.48-3.75 3.75z"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
