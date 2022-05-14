interface ViewModelBase {
  updateAsSource(path: string, updatedAt: number): void;
}

export interface IViewModel extends ViewModelBase {
  pageView: IPageViewModel;
}

export class BlankPage implements IPageViewModel {
  type = "blank";
  constructor() {
    // do nothing
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateAsSource(_path: string, _updatedAt: number): void {
    // do nothing
  }
}

export class ViewModel implements IViewModel {
  pageView: IPageViewModel;
  constructor() {
    this.pageView = new BlankPage();
  }
  updateAsSource(path: string, updatedAt: number): void {
    this.pageView.updateAsSource(path, updatedAt);
  }
}

// export const store = new ViewModel();

export interface IPageViewModel extends ViewModelBase {
  readonly type: string;
}
