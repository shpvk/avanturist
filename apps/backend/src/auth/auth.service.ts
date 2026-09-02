import {Injectable, UnauthorizedException} from '@nestjs/common';
import {UserService} from "../user/user.service";
import {verify} from "argon2";

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    public async register() {

    }


    async login(username: string, pass: string): Promise<any> {
        const user = await this.userService.findById(username);

        // argon2 throws on an empty or malformed stored hash, and that has to
        // fail the login instead of blowing up the request.
        const isPasswordValid = await verify(user.password, pass).catch(() => false);

        if (!isPasswordValid) {
            throw new UnauthorizedException();
        }
        const {password, ...result} = user;
        // TODO: Generate a JWT and return it here
        // instead of the user object
        return result;
    }

    public async logout() {}

    private async saveSession() {}
}
