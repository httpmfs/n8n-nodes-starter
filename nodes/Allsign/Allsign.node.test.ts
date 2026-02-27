import type {
	IDataObject,
	IExecuteFunctions,
} from 'n8n-workflow';
import { Allsign } from './Allsign.node';


// ============================================================
// Mock Helper
// ============================================================
const mockHttpRequest = jest.fn();
const mockAssertBinaryData = jest.fn();
const mockGetBinaryDataBuffer = jest.fn();

const getMockExecuteFunctions = (params: Record<string, unknown>): IExecuteFunctions => {
	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
			const val = params[name];
			if (val === undefined && fallback !== undefined) return fallback;
			if (val === undefined) return '';
			return val;
		},
		getCredentials: async () => ({
			apiKey: 'allsign_live_sk_test123',
			baseUrl: 'https://api.allsign.io',
		}),
		helpers: {
			httpRequest: mockHttpRequest,
			assertBinaryData: mockAssertBinaryData,
			getBinaryDataBuffer: mockGetBinaryDataBuffer,
		} as unknown as IExecuteFunctions['helpers'],
		continueOnFail: () => false,
		getNode: () => ({ name: 'AllSign' }),
	} as unknown as IExecuteFunctions;
};

// ============================================================
// Tests
// ============================================================
describe('AllSign Node', () => {
	const node = new Allsign();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	// ----------------------------------------------------------
	// Description / Metadata
	// ----------------------------------------------------------
	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('AllSign');
		});

		it('should NOT have resource or operation properties (single-purpose node)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			const operationProp = node.description.properties.find(
				(p) => p.name === 'operation',
			);
			expect(resourceProp).toBeUndefined();
			expect(operationProp).toBeUndefined();
		});

		it('should have collapsible collections for Send Invite Config and Signature Validations', () => {
			const sendConfig = node.description.properties.find(
				(p) => p.name === 'sendInviteConfig',
			);
			const sigValidations = node.description.properties.find(
				(p) => p.name === 'signatureValidations',
			);
			expect(sendConfig).toBeDefined();
			expect((sendConfig as any).type).toBe('collection');
			expect(sigValidations).toBeDefined();
			expect((sigValidations as any).type).toBe('collection');
		});

		it('should have base64 option in file source and folder name field', () => {
			const fileSourceProp = node.description.properties.find(
				(p) => p.name === 'fileSource',
			);
			const fileSourceOptions = (fileSourceProp as any).options.map((o: any) => o.value);
			expect(fileSourceOptions).toContain('base64');

			const folderProp = node.description.properties.find(
				(p) => p.name === 'folderName',
			);
			expect(folderProp).toBeDefined();
		});

		it('should have codex aliases for discoverability', () => {
			const aliases = node.description.codex?.alias || [];
			expect(aliases).toContain('Firma');
			expect(aliases).toContain('Documento');
			expect(aliases).toContain('Signature');
			expect(aliases).toContain('PDF');
			expect(aliases).toContain('NOM-151');
			expect(aliases).toContain('FEA');
			expect(aliases).toContain('eIDAS');
		});

		it('should be usable as a tool', () => {
			expect(node.description.usableAsTool).toBe(true);
		});

		it('should have autógrafa inside Signature Validations, not Send Invite Config', () => {
			const sigValidations = node.description.properties.find(
				(p) => p.name === 'signatureValidations',
			);
			const sigOptions = (sigValidations as any).options.map((o: any) => o.name);
			expect(sigOptions).toContain('verifyAutografa');

			const sendConfig = node.description.properties.find(
				(p) => p.name === 'sendInviteConfig',
			);
			const sendOptions = (sendConfig as any).options.map((o: any) => o.name);
			expect(sendOptions).not.toContain('verifyAutografa');
		});
	});

	// ----------------------------------------------------------
	// Create & Send (URL) — V2 Schema
	// ----------------------------------------------------------
	describe('Create & Send (URL)', () => {
		it('should download the file, convert to base64, and POST with V2 document schema', async () => {
			const pdfBuffer = Buffer.from('fake-pdf-content');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-123', name: 'Test Contract' });
			mockHttpRequest.mockResolvedValueOnce({ invited: 1 });

			const fn = getMockExecuteFunctions({
				documentName: 'Test Contract',
				fileSource: 'url',
				fileUrl: 'https://example.com/contract.pdf',
				'signers.signerValues': [{ name: 'John', email: 'john@test.com' }],
				sendInvitations: true,
				sendInviteConfig: { sendByEmail: true, sendByWhatsapp: false },
				signatureValidations: { verifyAutografa: true },
			});

			const result = await node.execute.call(fn);

			expect(mockHttpRequest).toHaveBeenCalledTimes(3);

			// First call: download the PDF
			expect(mockHttpRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({
				method: 'GET',
				url: 'https://example.com/contract.pdf',
				encoding: 'arraybuffer',
			}));

			// Second call: POST to V2 documents endpoint
			const postCall = mockHttpRequest.mock.calls[1][0];
			expect(postCall.method).toBe('POST');
			expect(postCall.url).toBe('https://api.allsign.io/v2/documents/');
			expect(postCall.headers).toEqual({ Authorization: 'Bearer allsign_live_sk_test123' });

			const body = postCall.body;
			expect(body.document).toEqual({
				base64Content: pdfBuffer.toString('base64'),
				name: 'contract.pdf',
			});
			expect(body.participants).toEqual([{ name: 'John', email: 'john@test.com' }]);
			expect(body.signatureValidation).toEqual(expect.objectContaining({
				autografa: true,
				FEA: false,
				nom151: false,
			}));
			expect(body.config).toEqual({
				sendInvitations: false,
				sendByEmail: false,
				sendByWhatsapp: false,
				startAtStep: 2,
			});

			// Third call: invite-bulk
			const inviteCall = mockHttpRequest.mock.calls[2][0];
			expect(inviteCall.method).toBe('POST');
			expect(inviteCall.url).toBe('https://api.allsign.io/v2/documents/doc-123/invite-bulk');

			expect(result[0][0].json).toEqual(expect.objectContaining({ id: 'doc-123', name: 'Test Contract' }));
		});

		it('should set correct signatureValidation for simple type', async () => {
			const pdfBuffer = Buffer.from('simple-pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-456' });

			const fn = getMockExecuteFunctions({
				documentName: 'Simple Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/simple.pdf',
				'signers.signerValues': [{ name: 'Jane', email: 'jane@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await node.execute.call(fn);
			const postBody = mockHttpRequest.mock.calls[1][0].body;

			expect(postBody.signatureValidation.autografa).toBe(false);
		});

		it('should set config to no invitations when no signers provided', async () => {
			const pdfBuffer = Buffer.from('draft-pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-draft' });

			const fn = getMockExecuteFunctions({
				documentName: 'Draft Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/draft.pdf',
				'signers.signerValues': [],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await node.execute.call(fn);
			const postBody = mockHttpRequest.mock.calls[1][0].body;
			expect(postBody.config).toEqual({
				sendInvitations: false,
				sendByEmail: false,
				sendByWhatsapp: false,
				startAtStep: 1,
			});
			expect(postBody.participants).toEqual([]);
		});
	});

	// ----------------------------------------------------------
	// Create & Send (Binary) — V2 Schema
	// ----------------------------------------------------------
	describe('Create & Send (Binary)', () => {
		it('should use binary data and POST with V2 document schema', async () => {
			const binaryBuffer = Buffer.from('binary-pdf-content');
			mockAssertBinaryData.mockReturnValueOnce({ fileName: 'contract.pdf' });
			mockGetBinaryDataBuffer.mockResolvedValueOnce(binaryBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-bin', name: 'Binary Upload' });
			mockHttpRequest.mockResolvedValueOnce({ invited: 1 });

			const fn = getMockExecuteFunctions({
				documentName: 'Binary Upload',
				fileSource: 'binary',
				binaryProperty: 'data',
				'signers.signerValues': [{ name: 'Bob', email: 'bob@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			const result = await node.execute.call(fn);

			expect(mockHttpRequest).toHaveBeenCalledTimes(2);

			const postCall = mockHttpRequest.mock.calls[0][0];
			expect(postCall.method).toBe('POST');
			expect(postCall.url).toBe('https://api.allsign.io/v2/documents/');

			const body = postCall.body;
			expect(body.document).toEqual({
				base64Content: binaryBuffer.toString('base64'),
				name: 'contract.pdf',
			});
			expect(body.participants).toEqual([{ name: 'Bob', email: 'bob@test.com' }]);

			const inviteCall = mockHttpRequest.mock.calls[1][0];
			expect(inviteCall.method).toBe('POST');
			expect(inviteCall.url).toBe('https://api.allsign.io/v2/documents/doc-bin/invite-bulk');

			expect(result[0][0].json).toEqual(expect.objectContaining({ id: 'doc-bin', name: 'Binary Upload' }));
		});

		it('should use documentName.pdf when binary has no fileName', async () => {
			const binaryBuffer = Buffer.from('content');
			mockAssertBinaryData.mockReturnValueOnce({ fileName: undefined });
			mockGetBinaryDataBuffer.mockResolvedValueOnce(binaryBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-noname' });

			const fn = getMockExecuteFunctions({
				documentName: 'Unnamed Doc',
				fileSource: 'binary',
				binaryProperty: 'data',
				'signers.signerValues': [],
				sendInvitations: false,
				signatureValidations: {},
			});

			await node.execute.call(fn);
			const body = mockHttpRequest.mock.calls[0][0].body;
			expect(body.document.name).toBe('document.pdf');
		});
	});

	// ----------------------------------------------------------
	// Signature Validation (V2 Schema)
	// ----------------------------------------------------------
	describe('Signature Validation', () => {
		it('should set signatureValidation fields based on toggles', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-ver' });

			const fn = getMockExecuteFunctions({
				documentName: 'Verified Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {
					verifyAutografa: true,
					verifyFea: true,
					verifyNom151: true,
					verifyConfirmName: true,
				},
			});

			await node.execute.call(fn);
			const body = mockHttpRequest.mock.calls[1][0].body;
			expect(body.signatureValidation).toEqual({
				autografa: true,
				FEA: true,
				nom151: true,
				biometric_signature: false,
				confirm_name_to_finish: true,
			});
		});

		it('should set ai_verification when identity sub-options are enabled', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-id' });

			const fn = getMockExecuteFunctions({
				documentName: 'Identity Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {
					verifyAutografa: true,
					verifyIdentity: true,
					verifyIdScan: true,
					verifyBiometricSelfie: true,
					verifySynthId: true,
				},
			});

			await node.execute.call(fn);
			const body = mockHttpRequest.mock.calls[1][0].body;
			expect(body.signatureValidation.ai_verification).toBe(true);
		});

		it('should not include ai_verification when identity is disabled', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-noid' });

			const fn = getMockExecuteFunctions({
				documentName: 'No Identity Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await node.execute.call(fn);
			const body = mockHttpRequest.mock.calls[1][0].body;
			expect(body.signatureValidation).not.toHaveProperty('ai_verification');
		});
	});

	// ----------------------------------------------------------
	// Multiple Signers
	// ----------------------------------------------------------
	describe('Multiple Signers', () => {
		it('should send multiple participants in one request', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-multi', name: 'Multi-Signer' });
			mockHttpRequest.mockResolvedValueOnce({ invited: 3 });

			const fn = getMockExecuteFunctions({
				documentName: 'Multi-Signer Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [
					{ name: 'Alice', email: 'alice@test.com' },
					{ name: 'Bob', email: 'bob@test.com' },
					{ name: 'Charlie', email: 'charlie@test.com' },
				],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await node.execute.call(fn);
			const body = mockHttpRequest.mock.calls[1][0].body;
			expect(body.participants).toHaveLength(3);
			expect(body.participants).toEqual([
				{ name: 'Alice', email: 'alice@test.com' },
				{ name: 'Bob', email: 'bob@test.com' },
				{ name: 'Charlie', email: 'charlie@test.com' },
			]);
			expect(body.config.sendInvitations).toBe(false);
			expect(body.config.startAtStep).toBe(2);

			expect(mockHttpRequest).toHaveBeenCalledTimes(3);
			const inviteCall = mockHttpRequest.mock.calls[2][0];
			expect(inviteCall.method).toBe('POST');
			expect(inviteCall.url).toBe('https://api.allsign.io/v2/documents/doc-multi/invite-bulk');
		});
	});

	// ----------------------------------------------------------
	// Auth Headers
	// ----------------------------------------------------------
	describe('Auth Headers', () => {
		it('should include Authorization Bearer header in all requests', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				documentName: 'Auth Test',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await node.execute.call(fn);
			expect(mockHttpRequest.mock.calls[1][0].headers).toEqual({
				Authorization: 'Bearer allsign_live_sk_test123',
			});
		});
	});

	// ----------------------------------------------------------
	// Base URL Handling
	// ----------------------------------------------------------
	describe('Base URL Handling', () => {
		it('should strip trailing slashes from base URL', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				documentName: 'Slash Test',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});
			(fn as any).getCredentials = async () => ({
				apiKey: 'allsign_live_sk_test123',
				baseUrl: 'https://api.allsign.io/',
			});

			await node.execute.call(fn);
			expect(mockHttpRequest.mock.calls[1][0].url).toBe('https://api.allsign.io/v2/documents/');
		});

		it('should use custom base URL for dev environments', async () => {
			const pdfBuffer = Buffer.from('pdf');
			mockHttpRequest.mockResolvedValueOnce(pdfBuffer);
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-dev' });

			const fn = getMockExecuteFunctions({
				documentName: 'Dev Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});
			(fn as any).getCredentials = async () => ({
				apiKey: 'allsign_trial_sk_dev456',
				baseUrl: 'http://localhost:8000',
			});

			await node.execute.call(fn);
			expect(mockHttpRequest.mock.calls[1][0].url).toBe('http://localhost:8000/v2/documents/');
		});
	});

	// ----------------------------------------------------------
	// Error Handling
	// ----------------------------------------------------------
	describe('Error Handling', () => {
		it('should throw NodeOperationError on API failure', async () => {
			mockHttpRequest.mockResolvedValueOnce(Buffer.from('pdf'));
			mockHttpRequest.mockRejectedValueOnce({
				response: { data: { message: 'Insufficient credits' }, status: 402 },
			});

			const fn = getMockExecuteFunctions({
				documentName: 'Error Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await expect(node.execute.call(fn)).rejects.toThrow('AllSign API Error: Insufficient credits');
		});

		it('should throw when file download fails', async () => {
			mockHttpRequest.mockRejectedValueOnce(new Error('File not found'));

			const fn = getMockExecuteFunctions({
				documentName: 'Bad URL Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/nonexistent.pdf',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				sendInvitations: true,
				sendInviteConfig: {},
				signatureValidations: {},
			});

			await expect(node.execute.call(fn)).rejects.toThrow('AllSign API Error');
		});

		it('should continue on fail when enabled', async () => {
			mockHttpRequest.mockRejectedValueOnce(new Error('Connection refused'));

			const fn = getMockExecuteFunctions({
				documentName: 'Fail Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				'signers.signerValues': [],
				sendInvitations: false,
				signatureValidations: {},
			});
			(fn as any).continueOnFail = () => true;

			const result = await node.execute.call(fn);
			expect(result[0][0].json).toHaveProperty('error', 'Connection refused');
		});
	});
});
