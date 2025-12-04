import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver()
export class SalesResolver {
    constructor(private salesService: SalesService) { }

    @Query(() => [Object])
    @UseGuards(GqlAuthGuard)
    async sales(
        @Args('assignedToId', { nullable: true }) assignedToId?: string,
    ) {
        return this.salesService.findAll({ assignedToId });
    }

    @Mutation(() => Object)
    @UseGuards(GqlAuthGuard)
    async createSale(@Args('input') input: any) {
        return this.salesService.create(input);
    }
}
