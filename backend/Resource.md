# Server Resource Access

Server 자원 접근은 이렇다.

Endpoint:

- /workspace/\<path... \>/: [file content](#file-content)
- /ws: feedback for refresh
- /auth/login: [login](#login)
- /auth/logout: [logout](#logout)
- /graphql
- /setting: configuration
- /app/\<path... \>/: frontend rendering

## Auth

### Login

- method: POST
- argument:
  ```ts
  type LoginArgument = {
    password: string;
  };
  ```
- return: `LoginReturnType`
  ```ts
  type LoginReturnType = {
    ok: boolean;
    reason?: string;
  };
  ```
- use only https context

example:

```js
const content = await (await fetch("/auth/login/", {
  Method: "POST",
  body: JSON.stringify({
    password: "********",
  }),
}).text());
console.log(content.ok); // ok
```

### Logout

- method: POST
- return: `LogoutReturnType`
  ```ts
  type LoginReturnType = {
    ok: true;
  };
  ```
- use only https context

```js
const content = await (await fetch("/auth/login/", {
  Method: "POST",
  body: JSON.stringify({
    password: "********",
  }),
}).text());
console.log(content.ok); // ok
```

## File Content

### File GET

- path: location of file
- query:
  - raw: get raw content
- return: content of file or list of `DirEntry`

```ts
interface DirEntry {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
}
```

example:

```js
const content = await (await fetch("<hostname>/fs/foo.md").text());
console.log(content);
```

### File PUT

- path: location of file
- query
  - dir: isDir
- return: `FilePutReturnType`
  ```ts
  type FilePutReturnType = {
    ok: boolean;
    reason?: string;
  };
  ```

example:

```js
const content = await (await fetch("<hostname>/fs/foo.md", {
  body: "# Foo\nbar",
  method: "PUT",
}).json());
console.log(content); //201 create
```

### File POST

### File DELETE

- path: location of file
- query: none
- return : `FileDeleteReturnType`
  ```ts
  type FileDeleteReturnType = {
    ok: boolean;
    reason?: string;
  };
  ```

example:

```js
const content = await (await fetch("<hostname>/fs/foo.md", {
  body: "# Foo\nbar",
  method: "DELETE",
}).json());
console.log(content.ok); // true if success.
```
