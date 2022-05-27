/**
 * Interface for Disposable objects.
 */
export interface IDisposable {
    dispose(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new(...args: any[]) => T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeDisposable<TBase extends Constructor<any>>(Base: TBase) {
    return class extends Base implements IDisposable {
        private _disposed = false;
        private _disposables: IDisposable[] = [];

        public addDisposable(disposable: IDisposable) {
            this._disposables.push(disposable);
        }

        public dispose() {
            if (this._disposed) {
                return;
            }
            this._disposed = true;
            for (const disposable of this._disposables) {
                disposable.dispose();
            }
            this._disposables = [];
        }
    };
}
