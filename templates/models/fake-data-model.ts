import { faker } from '@faker-js/faker';

faker.seed();

export type Cat = {
	id: number;
	type: string;
	description: string;
	price: string;
};

export function makeCat(partial: Partial<Cat> = {}): Cat {
	return {
		id: partial.id ?? faker.number.int({ min: 1, max: 1_000_000 }),
		type: partial.type ?? faker.animal.cat(),
		description: partial.description ?? faker.lorem.lines(5),
		price: partial.price ?? faker.commerce.price({ min: 50, max: 400 }),
	};
}
