import {Injectable} from "@nestjs/common";
import {Build} from "../generated/prisma/client";
import {PrismaService} from "../prisma/prisma.service";
import {CreateBuildDto} from "./dto/create-build.dto";


@Injectable()
export class BuildsService {
    constructor(private readonly prismaService: PrismaService) {}

    async findALl(): Promise<Build[]> {
        return this.prismaService.build.findMany();
    }

    // async createOne(build: CreateBuildDto) : Promise<Build> {
    //
    // }
}