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
describe('AllSign Node (MVP)', () => {
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

		it('should define only the document resource', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			const resourceOptions = (resourceProp as any).options.map((o: any) => o.value);
			expect(resourceOptions).toEqual(['document']);
		});

		it('should define only create and send operations', () => {
			const opProp = node.description.properties.find(
				(p) => p.name === 'operation' && (p.displayOptions?.show?.resource as string[])?.includes('document'),
			);
			const opValues = (opProp as any).options.map((o: any) => o.value);
			expect(opValues).toEqual(['create', 'send']);
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
	});

	// ----------------------------------------------------------
	// Document: Create (URL)
	// ----------------------------------------------------------
	describe('Document: Create (URL)', () => {
		it('should call POST /v2/documents with correct body', async () => {
			mockHttpRequest.mockResolvedValueOnce({ document_id: 'doc-123' });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'create',
				documentName: 'Test Contract',
				fileSource: 'url',
				fileUrl: 'https://example.com/doc.pdf',
				templateId: 'tpl-1',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents',
				body: expect.objectContaining({
					name: 'Test Contract',
					file_url: 'https://example.com/doc.pdf',
					template_id: 'tpl-1',
				}),
			}));
			expect(result[0][0].json).toEqual({ document_id: 'doc-123' });
		});

		it('should not include template_id when empty', async () => {
			mockHttpRequest.mockResolvedValueOnce({ document_id: 'doc-456' });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'create',
				documentName: 'Simple Doc',
				fileSource: 'url',
				fileUrl: 'https://example.com/simple.pdf',
				templateId: '',
			});

			await node.execute.call(fn);
			const callBody = mockHttpRequest.mock.calls[0][0].body;
			expect(callBody).not.toHaveProperty('template_id');
		});
	});

	// ----------------------------------------------------------
	// Document: Create (Binary)
	// ----------------------------------------------------------
	describe('Document: Create (Binary)', () => {
		it('should call POST /v2/documents with base64 data', async () => {
			mockHttpRequest.mockResolvedValueOnce({ document_id: 'doc-bin' });
			mockAssertBinaryData.mockReturnValueOnce({ fileName: 'contract.pdf' });
			mockGetBinaryDataBuffer.mockResolvedValueOnce(Buffer.from('pdf-content'));

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'create',
				documentName: 'Binary Upload',
				fileSource: 'binary',
				binaryProperty: 'data',
				templateId: '',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents',
				body: expect.objectContaining({
					name: 'Binary Upload',
					file_data: Buffer.from('pdf-content').toString('base64'),
					file_name: 'contract.pdf',
				}),
			}));
			expect(result[0][0].json).toEqual({ document_id: 'doc-bin' });
		});
	});

	// ----------------------------------------------------------
	// Document: Send
	// ----------------------------------------------------------
	describe('Document: Send', () => {
		it('should call POST /v2/documents/{id}/send with signers', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'doc-123',
				'signers.signerValues': [{ name: 'John', email: 'john@test.com' }],
				message: 'Please sign',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents/doc-123/send',
				body: expect.objectContaining({
					signers: [{ name: 'John', email: 'john@test.com' }],
					message: 'Please sign',
				}),
			}));
			expect(result[0][0].json).toEqual({ success: true });
		});

		it('should send multiple signers', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, sent: 2 });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'doc-456',
				'signers.signerValues': [
					{ name: 'Alice', email: 'alice@test.com' },
					{ name: 'Bob', email: 'bob@test.com' },
				],
				message: '',
			});

			const result = await node.execute.call(fn);
			const callBody = mockHttpRequest.mock.calls[0][0].body;
			expect(callBody.signers).toHaveLength(2);
			expect(callBody).not.toHaveProperty('message');
			expect(result[0][0].json).toHaveProperty('sent', 2);
		});

		it('should not include message when empty', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'doc-789',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
				message: '',
			});

			await node.execute.call(fn);
			const callBody = mockHttpRequest.mock.calls[0][0].body;
			expect(callBody).not.toHaveProperty('message');
		});
	});

	// ----------------------------------------------------------
	// Auth Headers
	// ----------------------------------------------------------
	describe('Auth Headers', () => {
		it('should include Authorization Bearer header in all requests', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'doc-1',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
			});

			await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				headers: { Authorization: 'Bearer allsign_live_sk_test123' },
			}));
		});
	});

	// ----------------------------------------------------------
	// Error Handling
	// ----------------------------------------------------------
	describe('Error Handling', () => {
		it('should throw NodeOperationError on API failure', async () => {
			mockHttpRequest.mockRejectedValueOnce({
				response: { data: { message: 'Document not found' }, status: 404 },
			});

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'non-existent',
				'signers.signerValues': [{ name: 'Test', email: 'test@test.com' }],
			});

			await expect(node.execute.call(fn)).rejects.toThrow('AllSign API Error: Document not found');
		});

		it('should continue on fail when enabled', async () => {
			mockHttpRequest.mockRejectedValueOnce(new Error('Connection refused'));

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'send',
				documentId: 'doc-fail',
				'signers.signerValues': [],
			});
			(fn as any).continueOnFail = () => true;

			const result = await node.execute.call(fn);
			expect(result[0][0].json).toHaveProperty('error', 'Connection refused');
		});
	});
});
