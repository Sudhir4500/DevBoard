import {User} from "@/types/domain"

export interface UserCreate extends Omit<User, "id" | "created_at"> {
    password: string;
}