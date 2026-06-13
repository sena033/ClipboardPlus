import { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  onDone?: () => void;
}

export default function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2000);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [message, onDone]);

  if (!visible || !message) return null;

  return (
    <div className="toast">
      <span>{message}</span>
    </div>
  );
}
