import {Controller, Get} from "@nestjs/common";
import {BuildsService} from "./builds.service";
import {Build} from "../generated/prisma/client";


@Controller('builds')
export class BuildsController {
    constructor(private readonly buildsService: BuildsService) {}

    @Get()
    findAll(): Promise<Build[]> {
        return this.buildsService.findAll();
    }
}
