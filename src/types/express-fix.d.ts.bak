declare module 'express' {
  export default function createApplication(): Express;
  
  export interface Express {
    use(middleware: any): Express;
    post(path: string, handler: (req: Request, res: Response) => void): Express;
    get(path: string, handler: (req: Request, res: Response) => void): Express;
    put(path: string, handler: (req: Request, res: Response) => void): Express;
    delete(path: string, handler: (req: Request, res: Response) => void): Express;
    listen(port: number, callback: () => void): any;
  }
  
  export interface Request {
    body: any;
    params: any;
    query: any;
  }
  
  export interface Response {
    status(code: number): Response;
    json(data: any): Response;
  }
  
  export function json(): any;
}

declare module 'cors' {
  export default function cors(): any;
}
