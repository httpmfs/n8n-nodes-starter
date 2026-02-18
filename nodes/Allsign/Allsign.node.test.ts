import type {
	IDataObject,
	IExecuteFunctions,
} from 'n8n-workflow';
import { Allsign } from './Allsign.node';


// ============================================================
// Mock Helper
// ============================================================
const mockHttpRequest = jest.fn();
const mockPrepareBinaryData = jest.fn();
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
			prepareBinaryData: mockPrepareBinaryData,
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

		it('should define all 6 resources', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			const resourceOptions = (resourceProp as any).options.map((o: any) => o.value);
			expect(resourceOptions).toContain('document');
			expect(resourceOptions).toContain('signer');
			expect(resourceOptions).toContain('signatureField');
			expect(resourceOptions).toContain('signature');
			expect(resourceOptions).toContain('contact');
			expect(resourceOptions).toContain('folder');
		});

		it('should have codex aliases for all signature types', () => {
			const aliases = node.description.codex?.alias || [];
			expect(aliases).toContain('Biometrica');
			expect(aliases).toContain('NOM-151');
			expect(aliases).toContain('FEA');
			expect(aliases).toContain('eIDAS');
			expect(aliases).toContain('Firmante');
		});

		it('should define all document operations', () => {
			const opProp = node.description.properties.find(
				(p) => p.name === 'operation' && (p.displayOptions?.show?.resource as string[])?.includes('document'),
			);
			const opValues = (opProp as any).options.map((o: any) => o.value);
			expect(opValues).toEqual(expect.arrayContaining([
				'create', 'get', 'getAll', 'send', 'download', 'void', 'delete',
				'update', 'invite', 'inviteBulk', 'getStats',
				'updateSignatureValidations', 'updateSignatureState',
			]));
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
	});

	// ----------------------------------------------------------
	// Document: Get
	// ----------------------------------------------------------
	describe('Document: Get', () => {
		it('should call GET /v2/documents/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-123', status: 'pending' });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'get',
				documentId: 'doc-123',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/documents/doc-123',
			}));
			expect(result[0][0].json).toHaveProperty('id', 'doc-123');
		});
	});

	// ----------------------------------------------------------
	// Document: Get All
	// ----------------------------------------------------------
	describe('Document: Get All', () => {
		it('should return individual items for array response', async () => {
			mockHttpRequest.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'getAll',
				limit: 10,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/documents',
				qs: { limit: 10 },
			}));
			expect(result[0]).toHaveLength(2);
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
	});

	// ----------------------------------------------------------
	// Document: Void
	// ----------------------------------------------------------
	describe('Document: Void', () => {
		it('should call POST /v2/documents/{id}/void with reason', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'void',
				documentId: 'doc-123',
				reason: 'Terms changed',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents/doc-123/void',
				body: { reason: 'Terms changed' },
			}));
			expect(result[0][0].json).toEqual({ success: true });
		});
	});

	// ----------------------------------------------------------
	// Document: Delete
	// ----------------------------------------------------------
	describe('Document: Delete', () => {
		it('should call DELETE /v2/documents/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'delete',
				documentId: 'doc-123',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: 'https://api.allsign.io/v2/documents/doc-123',
			}));
		});
	});

	// ----------------------------------------------------------
	// Document: Update Signature Validations
	// ----------------------------------------------------------
	describe('Document: Update Signature Validations', () => {
		it('should send all 5 signature types to the API', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'updateSignatureValidations',
				documentId: 'doc-123',
				autografa: true,
				fea: true,
				nom151: true,
				eidas: false,
				firmaBiometrica: true,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PATCH',
				url: 'https://api.allsign.io/api/documents/doc-123/signature-validations',
				body: {
					signatureValidations: {
						autografa: true,
						FEA: true,
						nom151: true,
						eIDAS: false,
						firmaBiometrica: true,
					},
				},
			}));
			expect(result[0][0].json).toEqual({ success: true });
		});

		it('should default autografa=true and others=false', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'updateSignatureValidations',
				documentId: 'doc-456',
				autografa: true,
				fea: false,
				nom151: false,
				eidas: false,
				firmaBiometrica: false,
			});

			await node.execute.call(fn);
			const callBody = mockHttpRequest.mock.calls[0][0].body;
			expect(callBody.signatureValidations.autografa).toBe(true);
			expect(callBody.signatureValidations.FEA).toBe(false);
			expect(callBody.signatureValidations.nom151).toBe(false);
			expect(callBody.signatureValidations.eIDAS).toBe(false);
			expect(callBody.signatureValidations.firmaBiometrica).toBe(false);
		});
	});

	// ----------------------------------------------------------
	// Document: Update Signature State
	// ----------------------------------------------------------
	describe('Document: Update Signature State', () => {
		it('should send status to PATCH endpoint', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, data: { status: 'ESPERANDO_FIRMAS' } });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'updateSignatureState',
				documentId: 'doc-123',
				signatureStatus: 'ESPERANDO_FIRMAS',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PATCH',
				url: 'https://api.allsign.io/api/documents/doc-123/signature-state',
				body: { status: 'ESPERANDO_FIRMAS' },
			}));
			expect(result[0][0].json).toHaveProperty('success', true);
		});
	});

	// ----------------------------------------------------------
	// Signer: Add
	// ----------------------------------------------------------
	describe('Signer: Add', () => {
		it('should call POST /api/documents/{id}/add-signer', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, data: { email: 'signer@test.com' } });

			const fn = getMockExecuteFunctions({
				resource: 'signer',
				operation: 'add',
				documentId: 'doc-123',
				signerEmail: 'signer@test.com',
				invitedByEmail: 'admin@test.com',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/api/documents/doc-123/add-signer',
				body: {
					signerEmail: 'signer@test.com',
					invitedByEmail: 'admin@test.com',
				},
			}));
			expect(result[0][0].json).toHaveProperty('success', true);
		});
	});

	// ----------------------------------------------------------
	// Signature Field: Add
	// ----------------------------------------------------------
	describe('Signature Field: Add', () => {
		it('should call POST add-signature-field with required + optional fields', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'signatureField',
				operation: 'add',
				documentId: 'doc-123',
				sfSignerEmail: 'signer@test.com',
				sfPageNumber: 2,
				sfAdditionalFields: { x: 100, y: 200, width: 300, height: 150 },
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/api/documents/doc-123/add-signature-field',
				body: expect.objectContaining({
					signerEmail: 'signer@test.com',
					pageNumber: 2,
					x: 100,
					y: 200,
					width: 300,
					height: 150,
				}),
			}));
			expect(result[0][0].json).toEqual({ success: true });
		});
	});

	// ----------------------------------------------------------
	// Signature Field: Add Multiple
	// ----------------------------------------------------------
	describe('Signature Field: Add Multiple', () => {
		it('should call POST add-signature-fields with array of fields', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, data: { added: 2 } });

			const fields = [
				{ signerEmail: 'a@test.com', pageNumber: 1, x: 10, y: 20, width: 200, height: 100 },
				{ signerEmail: 'b@test.com', pageNumber: 2, x: 50, y: 60, width: 200, height: 100 },
			];

			const fn = getMockExecuteFunctions({
				resource: 'signatureField',
				operation: 'addMultiple',
				documentId: 'doc-123',
				'sfFields.fieldValues': fields,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/api/documents/doc-123/add-signature-fields',
				body: { fields },
			}));
			expect(result[0][0].json).toHaveProperty('success', true);
		});
	});

	// ----------------------------------------------------------
	// Signature Field: Update
	// ----------------------------------------------------------
	describe('Signature Field: Update', () => {
		it('should call PUT update-signature-field with fieldId and updates', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'signatureField',
				operation: 'update',
				documentId: 'doc-123',
				sfFieldId: 'field-abc',
				sfUpdateSignerEmail: 'signer@test.com',
				sfUpdateFields: { x: 300, y: 400, pageNumber: 3 },
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PUT',
				url: 'https://api.allsign.io/api/documents/doc-123/update-signature-field',
				body: expect.objectContaining({
					fieldId: 'field-abc',
					signerEmail: 'signer@test.com',
					x: 300,
					y: 400,
					pageNumber: 3,
				}),
			}));
		});
	});

	// ----------------------------------------------------------
	// Signature Field: Delete
	// ----------------------------------------------------------
	describe('Signature Field: Delete', () => {
		it('should call DELETE delete-signature-field with correct body', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'signatureField',
				operation: 'delete',
				documentId: 'doc-123',
				sfDeleteFieldId: 'field-xyz',
				sfDeleteSignerEmail: 'signer@test.com',
				deleteLinkedFields: true,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: 'https://api.allsign.io/api/documents/doc-123/delete-signature-field',
				body: {
					fieldId: 'field-xyz',
					signerEmail: 'signer@test.com',
					deleteLinkedFields: true,
				},
			}));
		});
	});

	// ----------------------------------------------------------
	// Signature: Delete
	// ----------------------------------------------------------
	describe('Signature: Delete', () => {
		it('should call DELETE /api/documents/{docId}/signature/{sigId}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, detail: 'Signature deleted' });

			const fn = getMockExecuteFunctions({
				resource: 'signature',
				operation: 'delete',
				documentId: 'doc-123',
				signatureId: 'sig-456',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: 'https://api.allsign.io/api/documents/doc-123/signature/sig-456',
			}));
			expect(result[0][0].json).toHaveProperty('success', true);
		});
	});

	// ----------------------------------------------------------
	// Auth Headers
	// ----------------------------------------------------------
	describe('Auth Headers', () => {
		it('should include Authorization Bearer header in all requests', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-1' });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'get',
				documentId: 'doc-1',
			});

			await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				headers: { Authorization: 'Bearer allsign_live_sk_test123' },
			}));
		});
	});

	// ----------------------------------------------------------
	// Document: Update
	// ----------------------------------------------------------
	describe('Document: Update', () => {
		it('should call PATCH /v2/documents/{id} with update fields', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'doc-123', name: 'Updated Name' });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'update',
				documentId: 'doc-123',
				updateFields: { name: 'Updated Name', description: 'New desc' },
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PATCH',
				url: 'https://api.allsign.io/v2/documents/doc-123',
				body: { name: 'Updated Name', description: 'New desc' },
			}));
			expect(result[0][0].json).toHaveProperty('name', 'Updated Name');
		});
	});

	// ----------------------------------------------------------
	// Document: Get Stats
	// ----------------------------------------------------------
	describe('Document: Get Stats', () => {
		it('should call GET /v2/documents/stats', async () => {
			mockHttpRequest.mockResolvedValueOnce({ total: 42, pending: 10 });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'getStats',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/documents/stats',
			}));
			expect(result[0][0].json).toHaveProperty('total', 42);
		});
	});

	// ----------------------------------------------------------
	// Document: Invite
	// ----------------------------------------------------------
	describe('Document: Invite', () => {
		it('should call POST /v2/documents/{id}/invite with email', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'invite',
				documentId: 'doc-123',
				inviteEmail: 'signer@test.com',
				inviteName: 'John Doe',
				inviteMessage: 'Please sign this',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents/doc-123/invite',
				body: expect.objectContaining({
					email: 'signer@test.com',
					name: 'John Doe',
					message: 'Please sign this',
				}),
			}));
			expect(result[0][0].json).toEqual({ success: true });
		});
	});

	// ----------------------------------------------------------
	// Document: Invite Bulk
	// ----------------------------------------------------------
	describe('Document: Invite Bulk', () => {
		it('should call POST /v2/documents/{id}/invite-bulk with participants', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true, invited: 2 });

			const participants = [
				{ email: 'a@test.com', name: 'Alice' },
				{ email: 'b@test.com', name: 'Bob' },
			];

			const fn = getMockExecuteFunctions({
				resource: 'document',
				operation: 'inviteBulk',
				documentId: 'doc-123',
				'inviteParticipants.participantValues': participants,
				inviteBulkMessage: 'Sign please',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/documents/doc-123/invite-bulk',
				body: expect.objectContaining({
					participants,
					message: 'Sign please',
				}),
			}));
			expect(result[0][0].json).toHaveProperty('invited', 2);
		});
	});

	// ----------------------------------------------------------
	// Folder: Get All
	// ----------------------------------------------------------
	describe('Folder: Get All', () => {
		it('should call GET /v2/folders', async () => {
			mockHttpRequest.mockResolvedValueOnce([{ id: 'f1', name: 'Contracts' }]);

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'getAll',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/folders',
			}));
			expect(result[0]).toHaveLength(1);
		});
	});

	// ----------------------------------------------------------
	// Folder: Get
	// ----------------------------------------------------------
	describe('Folder: Get', () => {
		it('should call GET /v2/folders/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'f1', name: 'Contracts' });

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'get',
				folderId: 'f1',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/folders/f1',
			}));
			expect(result[0][0].json).toHaveProperty('name', 'Contracts');
		});
	});

	// ----------------------------------------------------------
	// Folder: Create
	// ----------------------------------------------------------
	describe('Folder: Create', () => {
		it('should call POST /v2/folders with name', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'f2', name: 'New Folder' });

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'create',
				folderName: 'New Folder',
				parentFolderId: 'f1',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/folders',
				body: expect.objectContaining({ name: 'New Folder' }),
			}));
			expect(result[0][0].json).toHaveProperty('id', 'f2');
		});
	});

	// ----------------------------------------------------------
	// Folder: Update
	// ----------------------------------------------------------
	describe('Folder: Update', () => {
		it('should call PATCH /v2/folders/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'f1', name: 'Renamed' });

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'update',
				folderId: 'f1',
				folderUpdateFields: { name: 'Renamed' },
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PATCH',
				url: 'https://api.allsign.io/v2/folders/f1',
			}));
			expect(result[0][0].json).toHaveProperty('name', 'Renamed');
		});
	});

	// ----------------------------------------------------------
	// Folder: Delete
	// ----------------------------------------------------------
	describe('Folder: Delete', () => {
		it('should call DELETE /v2/folders/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'delete',
				folderId: 'f1',
			});

			await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: 'https://api.allsign.io/v2/folders/f1',
			}));
		});
	});

	// ----------------------------------------------------------
	// Folder: Get Documents
	// ----------------------------------------------------------
	describe('Folder: Get Documents', () => {
		it('should call GET /v2/folders/{id}/documents', async () => {
			mockHttpRequest.mockResolvedValueOnce([{ id: 'doc-1' }, { id: 'doc-2' }]);

			const fn = getMockExecuteFunctions({
				resource: 'folder',
				operation: 'getDocuments',
				folderId: 'f1',
				limit: 25,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/folders/f1/documents',
			}));
			expect(result[0]).toHaveLength(2);
		});
	});

	// ----------------------------------------------------------
	// Contact: Get All
	// ----------------------------------------------------------
	describe('Contact: Get All', () => {
		it('should call GET /v2/contacts', async () => {
			mockHttpRequest.mockResolvedValueOnce([{ id: 'c1', email: 'a@test.com' }]);

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'getAll',
				limit: 50,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/contacts',
			}));
			expect(result[0]).toHaveLength(1);
		});
	});

	// ----------------------------------------------------------
	// Contact: Get
	// ----------------------------------------------------------
	describe('Contact: Get', () => {
		it('should call GET /v2/contacts/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'c1', name: 'Alice' });

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'get',
				contactId: 'c1',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/contacts/c1',
			}));
			expect(result[0][0].json).toHaveProperty('name', 'Alice');
		});
	});

	// ----------------------------------------------------------
	// Contact: Create
	// ----------------------------------------------------------
	describe('Contact: Create', () => {
		it('should call POST /v2/contacts with email and name', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'c2', email: 'new@test.com' });

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'create',
				contactEmail: 'new@test.com',
				contactName: 'New Contact',
				contactPhone: '+5215555555',
				contactCompany: 'ACME',
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'POST',
				url: 'https://api.allsign.io/v2/contacts',
				body: expect.objectContaining({
					email: 'new@test.com',
					name: 'New Contact',
				}),
			}));
			expect(result[0][0].json).toHaveProperty('email', 'new@test.com');
		});
	});

	// ----------------------------------------------------------
	// Contact: Update
	// ----------------------------------------------------------
	describe('Contact: Update', () => {
		it('should call PATCH /v2/contacts/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ id: 'c1', name: 'Updated' });

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'update',
				contactId: 'c1',
				contactUpdateFields: { name: 'Updated' },
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'PATCH',
				url: 'https://api.allsign.io/v2/contacts/c1',
			}));
			expect(result[0][0].json).toHaveProperty('name', 'Updated');
		});
	});

	// ----------------------------------------------------------
	// Contact: Delete
	// ----------------------------------------------------------
	describe('Contact: Delete', () => {
		it('should call DELETE /v2/contacts/{id}', async () => {
			mockHttpRequest.mockResolvedValueOnce({ success: true });

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'delete',
				contactId: 'c1',
			});

			await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'DELETE',
				url: 'https://api.allsign.io/v2/contacts/c1',
			}));
		});
	});

	// ----------------------------------------------------------
	// Contact: Get Documents
	// ----------------------------------------------------------
	describe('Contact: Get Documents', () => {
		it('should call GET /v2/contacts/{id}/documents', async () => {
			mockHttpRequest.mockResolvedValueOnce([{ id: 'doc-1' }]);

			const fn = getMockExecuteFunctions({
				resource: 'contact',
				operation: 'getDocuments',
				contactId: 'c1',
				limit: 25,
			});

			const result = await node.execute.call(fn);
			expect(mockHttpRequest).toHaveBeenCalledWith(expect.objectContaining({
				method: 'GET',
				url: 'https://api.allsign.io/v2/contacts/c1/documents',
			}));
			expect(result[0]).toHaveLength(1);
		});
	});
});

