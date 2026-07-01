import { faker } from '@faker-js/faker';

faker.seed();

// Remember to change the model name from post
export type Post = {
	id: number;
	userId: number;
	title: string;
	body: string;
};

export function makePost(partial: Partial<Post> = {}): Post {
	return {
		id: partial.id ?? faker.number.int({ min: 1, max: 1_000_000 }),
		userId: partial.userId ?? faker.number.int({ min: 1, max: 1_000 }),
		title: partial.title ?? faker.lorem.sentence(),
		body: partial.body ?? faker.lorem.paragraphs(2),
	};
}
