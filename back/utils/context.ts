import { type Infer, type LesanContenxt, object, type ObjectId } from "lesan";
import { user_pure } from "../models/user.ts";

type Merge<A, B> =
  & {
    [K in keyof A]: K extends keyof B ? B[K] : A[K];
  }
  & B extends infer O ? { [K in keyof O]: O[K] }
  : never;

const userPureObj = object(user_pure);

type UserPure = Infer<typeof userPureObj>;

export interface MyContext extends LesanContenxt {
  user: Merge<
    {
      _id: ObjectId;
    },
    Partial<UserPure>
  >;
}
