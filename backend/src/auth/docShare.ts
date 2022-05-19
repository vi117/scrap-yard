import * as RPC from "model";
import { sessionStore } from "./session.ts";
import { createUser } from "./user.ts";

export interface ShareDocInfo extends RPC.ShareDocDescription {
  shareToken: string;
}

export interface ShareDocStore {
  get(docPath: string): ShareDocInfo | undefined;
  set(docPath: string, info: ShareDocInfo): this;
  delete(docPath: string): boolean;
}

class ShareDocStoreType extends Map<string, ShareDocInfo>
  implements ShareDocStore {
  set(docPath: string, info: ShareDocInfo): this {
    sessionStore.set(
      info.shareToken,
      createUser(info.shareToken, {
        basepath: info.basePath,
        write: info.write,
        expiredAt: info.expired,
      }),
    );
    return super.set(docPath, info);
  }
  delete(docPath: string): boolean {
    const info = this.get(docPath);
    if (info) {
      sessionStore.delete(info.shareToken);
    }
    return super.delete(docPath);
  }
}

export const ShareDocStore = new ShareDocStoreType();
