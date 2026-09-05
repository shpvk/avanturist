import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import { AuthMethod } from '../generated/prisma/enums'
import {hash} from "argon2";

@Injectable()
export class UserService {
    public constructor(private readonly prismaService: PrismaService) {}

    public async findById(id: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                id
            },
            include: {
                accounts: true
            }
        })

        if(!user){
            throw new NotFoundException('User not found');
        }
        return user;
    }

    public async findByEmail(email: string){
        const user = await this.prismaService.user.findUnique({
            where: {
                email
            },
            include: {
                accounts: true
            }
        })

        if(!user){
            throw new NotFoundException('User not found');
        }

        return user;
    }

    /** Same lookup as findByEmail, but a missing user is an answer rather than an error. */
    public async findByEmailOrNull(email: string){
        return this.prismaService.user.findUnique({
            where: {
                email
            },
            include: {
                accounts: true
            }
        })
    }

    public async create(
        email: string,
        password: string,
        displayName: string,
        picture: string,
        method: AuthMethod,
        isVerified: boolean,
        ) {
        const user = await this.prismaService.user.create({
            data: {
                email,
                password: password ? await hash(password) : '',
                displayName,
                picture,
                method,
                isVerified,
            },
            include: {
                accounts: true
            }
        })

        return user;
    }
}
