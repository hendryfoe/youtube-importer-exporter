import { render } from 'react-dom';
import { ToastContainer } from './toast';
import { ToastFactoryPayload } from './toast.interface';

const portalId = 'test-toast-portal';

class ToastFactory {
  private _add: (message: string) => void;
  private _close: (toastId: number) => void;
  private _closeAll: () => void;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    let portal: HTMLElement;
    const existingPortal = document.getElementById(portalId);

    if (existingPortal) {
      portal = existingPortal;
    } else {
      const div = document.createElement('div');
      div.id = portalId;
      document.body?.appendChild(div);
      portal = div;
    }

    render(<ToastContainer notify={this.bindFunctions} />, portal);
  }

  private bindFunctions = (methods: ToastFactoryPayload) => {
    this._add = methods.add;
    this._close = methods.close;
    this._closeAll = methods.closeAll;
  };

  notify = (message: string) => {
    this._add(message);
  };

  closeAll = () => {
    this._closeAll();
  }
}

export const toast = new ToastFactory();
