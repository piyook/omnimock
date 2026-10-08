import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

type RequestBody = {
	userQuestion: string | undefined;
};

export const handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	// On aws its JSON.parse (event.body) to get the body as an object

	if (!event?.body) {
		throw new Error('Invalid Payload : must contain a body property');
	}

	const payload = JSON.parse(event.body) as RequestBody;

	if (!payload?.userQuestion) {
		throw new Error(
			'Invalid Payload : must contain a userQuestion property',
		);
	}

	const { userQuestion } = payload;

	try {
		return {
			statusCode: 200,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				demoOutput: `this is demo lambda output based on ${userQuestion}`,
			}),
		};
	} catch (error) {
		console.log(error);
		return {
			statusCode: 500,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ errorMessage: error }),
		};
		/* Catch error to handle lambda function error gracefully 
		but do nothing since default function behavior is to throw error below */
	}
};
