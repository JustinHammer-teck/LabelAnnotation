import { type FC, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@humansignal/shad/components/ui/dialog';
import { useAviationTranslation } from '../../../i18n';
import { Button } from '../button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
}) => {
  const { t } = useAviationTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelText || t('common.cancel')}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : confirmText || t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
