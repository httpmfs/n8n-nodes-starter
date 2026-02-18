import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Allsign implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AllSign',
		name: 'allsign',
		icon: 'file:allsign.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Create, sign, and manage documents with AllSign e-signature platform. Firma electrónica, NOM-151, FEA, eIDAS.',
		defaults: {
			name: 'AllSign',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'allSignApi',
				required: true,
			},
		],
		codex: {
			alias: [
				'Firma',
				'Documento',
				'Contrato',
				'Signature',
				'PDF',
				'Sign',
				'Biometrica',
				'NOM-151',
				'FEA',
				'eIDAS',
				'Signer',
				'Firmante',
			],
		},
		properties: [
			// ------ Resource ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'document',
				options: [
					{
						name: 'Contact',
						value: 'contact',
						description: 'Manage your signing contacts',
					},
					{
						name: 'Document',
						value: 'document',
						description: 'Create, send, and manage documents for signing',
					},
					{
						name: 'Folder',
						value: 'folder',
						description: 'Organize documents into folders',
					},
					{
						name: 'Signature',
						value: 'signature',
						description: 'Manage signatures on documents',
					},
					{
						name: 'Signature Field',
						value: 'signatureField',
						description: 'Place and manage signature fields on PDF pages',
					},
					{
						name: 'Signer',
						value: 'signer',
						description: 'Add signers to documents',
					},
				],
			},
			// ------ Operation ------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['document'],
					},
				},
				default: 'create',
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create and upload a new document for signing',
						action: 'Create a document',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a document',
						action: 'Delete a document',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download the signed PDF document',
						action: 'Download a document',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Retrieve a document by ID',
						action: 'Get a document',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Retrieve multiple documents',
						action: 'Get many documents',
					},
					{
						name: 'Get Stats',
						value: 'getStats',
						description: 'Get document statistics (total, by type, recent)',
						action: 'Get document statistics',
					},
					{
						name: 'Invite',
						value: 'invite',
						description: 'Invite a participant to sign a document',
						action: 'Invite a participant to sign',
					},
					{
						name: 'Invite Bulk',
						value: 'inviteBulk',
						description: 'Invite multiple participants to sign at once',
						action: 'Invite multiple participants to sign',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send a document for signing',
						action: 'Send a document for signing',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a document (rename, move to folder, update config)',
						action: 'Update a document',
					},
					{
						name: 'Update Signature State',
						value: 'updateSignatureState',
						description: 'Update the signature workflow state of a document',
						action: 'Update signature state',
					},
					{
						name: 'Update Signature Validations',
						value: 'updateSignatureValidations',
						description: 'Configure signature types: Autógrafa, FEA, NOM-151, eIDAS, Biométrica',
						action: 'Update signature validations',
					},
					{
						name: 'Void',
						value: 'void',
						description: 'Cancel/void a document signing process',
						action: 'Void a document',
					},
				],
			},

			// ====== CREATE fields ======
			{
				displayName: 'Document Name',
				name: 'documentName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. Contract Q1 2026',
				description: 'Name for the new document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'File Source',
				name: 'fileSource',
				type: 'options',
				default: 'binary',
				options: [
					{
						name: 'Binary Input',
						value: 'binary',
						description: 'Use binary data from a previous node',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Provide a public URL to the PDF file',
					},
				],
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the PDF file',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
						fileSource: ['binary'],
					},
				},
			},
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/document.pdf',
				description: 'Public URL of the PDF file to upload',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
						fileSource: ['url'],
					},
				},
			},
			{
				displayName: 'Template Name or ID',
				name: 'templateId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTemplates',
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['create'],
					},
				},
			},

			// ====== GET / DELETE / DOWNLOAD / SEND / VOID fields ======
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: [
							'get',
							'delete',
							'download',
							'send',
							'void',
						'update',
						'invite',
						'inviteBulk',
							'updateSignatureValidations',
							'updateSignatureState',
						],
					},
				},
			},

			// ====== DOWNLOAD fields ======
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property in which to store the downloaded file',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['download'],
					},
				},
			},

			// ====== GET ALL fields ======
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['getAll'],
					},
				},
			},

			// ====== SEND fields ======
			{
				displayName: 'Signers',
				name: 'signers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Signer',
				description: 'People who need to sign the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
				options: [
					{
						name: 'signerValues',
						displayName: 'Signer',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Full name of the signer',
							},
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
								description: 'Email address of the signer',
							},
						],
					},
				],
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				placeholder: 'Please sign this document...',
				description: 'Optional message to include in the signing invitation',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['send'],
					},
				},
			},

			// ====== VOID fields ======
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
				placeholder: 'e.g. Document terms changed',
				description: 'Reason for voiding the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['void'],
					},
				},
			},

			// ====== UPDATE fields ======
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['document'], operation: ['update'] } },
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'New name for the document' },
					{ displayName: 'Description', name: 'description', type: 'string', default: '', description: 'New description' },
					{ displayName: 'Folder ID', name: 'folderId', type: 'string', default: '', description: 'Move document to this folder (use empty to remove from folder)' },
				],
			},

			// ====== INVITE fields ======
			{
				displayName: 'Participant Email',
				name: 'inviteEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'participant@email.com',
				description: 'Email of the participant to invite',
				displayOptions: { show: { resource: ['document'], operation: ['invite'] } },
			},
			{
				displayName: 'Participant Name',
				name: 'inviteName',
				type: 'string',
				default: '',
				placeholder: 'John Doe',
				description: 'Name of the participant',
				displayOptions: { show: { resource: ['document'], operation: ['invite'] } },
			},
			{
				displayName: 'Message',
				name: 'inviteMessage',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				placeholder: 'Please sign this document...',
				description: 'Optional message to include in the invitation',
				displayOptions: { show: { resource: ['document'], operation: ['invite'] } },
			},

			// ====== INVITE BULK fields ======
			{
				displayName: 'Participants',
				name: 'inviteParticipants',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				placeholder: 'Add Participant',
				description: 'Participants to invite',
				displayOptions: { show: { resource: ['document'], operation: ['inviteBulk'] } },
				options: [
					{
						name: 'participantValues',
						displayName: 'Participant',
						values: [
							{ displayName: 'Email', name: 'email', type: 'string', default: '', required: true, placeholder: 'participant@email.com', description: 'Email of the participant' },
							{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Name of the participant' },
						],
					},
				],
			},
			{
				displayName: 'Message',
				name: 'inviteBulkMessage',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				placeholder: 'Please sign this document...',
				description: 'Optional message to include in the invitations',
				displayOptions: { show: { resource: ['document'], operation: ['inviteBulk'] } },
			},

			// ====== UPDATE SIGNATURE VALIDATIONS fields ======
			{
				displayName: 'Autógrafa',
				name: 'autografa',
				type: 'boolean',
				default: true,
				description: 'Whether to require handwritten signature (Firma manuscrita digital)',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'FEA (Firma Electrónica Avanzada)',
				name: 'fea',
				type: 'boolean',
				default: false,
				description: 'Whether to require Firma Electrónica Avanzada validation',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'NOM-151',
				name: 'nom151',
				type: 'boolean',
				default: false,
				description: 'Whether to require NOM-151-SCFI validation (Mexico)',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'eIDAS',
				name: 'eidas',
				type: 'boolean',
				default: false,
				description: 'Whether to require eIDAS validation (European Union)',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'Firma Biométrica',
				name: 'firmaBiometrica',
				type: 'boolean',
				default: false,
				description: 'Whether to require biometric signature (Selfie/proof of life)',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'AI Verification (SynthID)',
				name: 'aiVerification',
				type: 'boolean',
				default: false,
				description: 'Whether to enable AI-powered verification (ID authenticity, liveness detection, SynthID)',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},
			{
				displayName: 'Confirm Name to Finish',
				name: 'confirmNameToFinish',
				type: 'boolean',
				default: false,
				description: 'Whether to require the signer to type their full name to complete the signing process',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureValidations'] } },
			},

			// ====== UPDATE SIGNATURE STATE fields ======
			{
				displayName: 'Status',
				name: 'signatureStatus',
				type: 'options',
				default: 'RECOLECTANDO_FIRMANTES',
				required: true,
				description: 'The new signature workflow state',
				displayOptions: { show: { resource: ['document'], operation: ['updateSignatureState'] } },
				options: [
					{ name: 'Sellos PDF', value: 'SELLOS_PDF' },
					{ name: 'Recolectando Firmantes', value: 'RECOLECTANDO_FIRMANTES' },
					{ name: 'Esperando Firmas', value: 'ESPERANDO_FIRMAS' },
					{ name: 'Generando PDF', value: 'GENERANDO_PDF' },
					{ name: 'Todos Firmaron', value: 'TODOS_FIRMARON' },
				],
			},

			// ============================================================
			// SIGNER RESOURCE
			// ============================================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['signer'] } },
				default: 'add',
				options: [
					{ name: 'Add', value: 'add', description: 'Add a signer to a document', action: 'Add a signer' },
				],
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document',
				displayOptions: { show: { resource: ['signer'] } },
			},
			{
				displayName: 'Signer Email',
				name: 'signerEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'signer@email.com',
				description: 'Email address of the signer to add',
				displayOptions: { show: { resource: ['signer'], operation: ['add'] } },
			},
			{
				displayName: 'Invited By Email',
				name: 'invitedByEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'you@email.com',
				description: 'Email of the user who is adding the signer',
				displayOptions: { show: { resource: ['signer'], operation: ['add'] } },
			},

			// ============================================================
			// SIGNATURE FIELD RESOURCE
			// ============================================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['signatureField'] } },
				default: 'add',
				options: [
					{ name: 'Add', value: 'add', description: 'Add a signature field to a document', action: 'Add a signature field' },
					{ name: 'Add Multiple', value: 'addMultiple', description: 'Add multiple signature fields at once', action: 'Add multiple signature fields' },
					{ name: 'Delete', value: 'delete', description: 'Delete a signature field', action: 'Delete a signature field' },
					{ name: 'Update', value: 'update', description: 'Update position or settings of a signature field', action: 'Update a signature field' },
				],
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document',
				displayOptions: { show: { resource: ['signatureField'] } },
			},
			// -- Add single field --
			{
				displayName: 'Signer Email',
				name: 'sfSignerEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'signer@email.com',
				description: 'Email of the signer for this signature field',
				displayOptions: { show: { resource: ['signatureField'], operation: ['add'] } },
			},
			{
				displayName: 'Page Number',
				name: 'sfPageNumber',
				type: 'number',
				default: 1,
				required: true,
				typeOptions: { minValue: 1 },
				description: 'Page number where the signature field will be placed',
				displayOptions: { show: { resource: ['signatureField'], operation: ['add'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'sfAdditionalFields',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['signatureField'], operation: ['add'] } },
				options: [
					{ displayName: 'X Position', name: 'x', type: 'number', default: 0, description: 'X coordinate' },
					{ displayName: 'Y Position', name: 'y', type: 'number', default: 0, description: 'Y coordinate' },
					{ displayName: 'Width', name: 'width', type: 'number', default: 200, description: 'Width of the field' },
					{ displayName: 'Height', name: 'height', type: 'number', default: 100, description: 'Height of the field' },
					{ displayName: 'Anchor String', name: 'anchorString', type: 'string', default: '', description: 'Text anchor to position the field in the PDF' },
					{ displayName: 'Include in All Pages', name: 'includeInAllPages', type: 'boolean', default: false, description: 'Whether the field should appear on all pages' },
					{ displayName: 'Field Type', name: 'type', type: 'string', default: 'signatureField', description: 'Type of the field' },
				],
			},
			// -- Add multiple fields --
			{
				displayName: 'Fields',
				name: 'sfFields',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				placeholder: 'Add Signature Field',
				description: 'Signature fields to add',
				displayOptions: { show: { resource: ['signatureField'], operation: ['addMultiple'] } },
				options: [
					{
						name: 'fieldValues',
						displayName: 'Signature Field',
						values: [
							{ displayName: 'Signer Email', name: 'signerEmail', type: 'string', default: '', required: true, description: 'Email of the signer' },
							{ displayName: 'Page Number', name: 'pageNumber', type: 'number', default: 1, required: true, description: 'Page number' },
							{ displayName: 'X Position', name: 'x', type: 'number', default: 0, description: 'X coordinate' },
							{ displayName: 'Y Position', name: 'y', type: 'number', default: 0, description: 'Y coordinate' },
							{ displayName: 'Width', name: 'width', type: 'number', default: 200, description: 'Width' },
							{ displayName: 'Height', name: 'height', type: 'number', default: 100, description: 'Height' },
						],
					},
				],
			},
			// -- Update field --
			{
				displayName: 'Field ID',
				name: 'sfFieldId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the signature field to update',
				displayOptions: { show: { resource: ['signatureField'], operation: ['update'] } },
			},
			{
				displayName: 'Signer Email',
				name: 'sfUpdateSignerEmail',
				type: 'string',
				default: '',
				required: true,
				description: 'Email of the signer who owns the field',
				displayOptions: { show: { resource: ['signatureField'], operation: ['update'] } },
			},
			{
				displayName: 'Update Fields',
				name: 'sfUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['signatureField'], operation: ['update'] } },
				options: [
					{ displayName: 'X Position', name: 'x', type: 'number', default: 0, description: 'Updated X coordinate' },
					{ displayName: 'Y Position', name: 'y', type: 'number', default: 0, description: 'Updated Y coordinate' },
					{ displayName: 'Page Number', name: 'pageNumber', type: 'number', default: 1, description: 'Updated page number' },
					{ displayName: 'Include in All Pages', name: 'includeInAllPages', type: 'boolean', default: false, description: 'Whether the field should appear on all pages' },
				],
			},
			// -- Delete field --
			{
				displayName: 'Field ID',
				name: 'sfDeleteFieldId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the signature field to delete',
				displayOptions: { show: { resource: ['signatureField'], operation: ['delete'] } },
			},
			{
				displayName: 'Signer Email',
				name: 'sfDeleteSignerEmail',
				type: 'string',
				default: '',
				required: true,
				description: 'Email of the signer who owns the field',
				displayOptions: { show: { resource: ['signatureField'], operation: ['delete'] } },
			},
			{
				displayName: 'Delete Linked Fields',
				name: 'deleteLinkedFields',
				type: 'boolean',
				default: false,
				description: 'Whether to also delete linked fields',
				displayOptions: { show: { resource: ['signatureField'], operation: ['delete'] } },
			},

			// ============================================================
			// SIGNATURE RESOURCE
			// ============================================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['signature'] } },
				default: 'delete',
				options: [
					{ name: 'Delete', value: 'delete', description: 'Delete a signature from a document', action: 'Delete a signature' },
				],
			},
			{
				displayName: 'Document ID',
				name: 'documentId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the document',
				displayOptions: { show: { resource: ['signature'] } },
			},
			{
				displayName: 'Signature ID',
				name: 'signatureId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the signature to delete',
				displayOptions: { show: { resource: ['signature'], operation: ['delete'] } },
			},

			// ============================================================
			// FOLDER RESOURCE
			// ============================================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['folder'] } },
				default: 'getAll',
				options: [
					{ name: 'Create', value: 'create', description: 'Create a new folder', action: 'Create a folder' },
					{ name: 'Delete', value: 'delete', description: 'Delete a folder', action: 'Delete a folder' },
					{ name: 'Get', value: 'get', description: 'Get a folder by ID', action: 'Get a folder' },
					{ name: 'Get Documents', value: 'getDocuments', description: 'Get documents in a folder', action: 'Get documents in a folder' },
					{ name: 'Get Many', value: 'getAll', description: 'List all folders in tree structure', action: 'Get many folders' },
					{ name: 'Update', value: 'update', description: 'Rename or move a folder', action: 'Update a folder' },
				],
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the folder',
				displayOptions: { show: { resource: ['folder'], operation: ['get', 'delete', 'update', 'getDocuments'] } },
			},
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. Contracts 2026',
				description: 'Name of the new folder',
				displayOptions: { show: { resource: ['folder'], operation: ['create'] } },
			},
			{
				displayName: 'Parent Folder ID',
				name: 'parentFolderId',
				type: 'string',
				default: '',
				description: 'ID of the parent folder (leave empty for root)',
				displayOptions: { show: { resource: ['folder'], operation: ['create'] } },
			},
			{
				displayName: 'Update Fields',
				name: 'folderUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['folder'], operation: ['update'] } },
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'New name for the folder' },
					{ displayName: 'Parent Folder ID', name: 'parentFolderId', type: 'string', default: '', description: 'Move folder to a new parent' },
				],
			},
			{
				displayName: 'Limit',
				name: 'folderDocsLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of documents to return',
				displayOptions: { show: { resource: ['folder'], operation: ['getDocuments'] } },
			},

			// ============================================================
			// CONTACT RESOURCE
			// ============================================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				default: 'getAll',
				options: [
					{ name: 'Create', value: 'create', description: 'Create a new contact', action: 'Create a contact' },
					{ name: 'Delete', value: 'delete', description: 'Delete a contact', action: 'Delete a contact' },
					{ name: 'Get', value: 'get', description: 'Get a contact by ID', action: 'Get a contact' },
					{ name: 'Get Documents', value: 'getDocuments', description: 'Get documents for a contact', action: 'Get documents for a contact' },
					{ name: 'Get Many', value: 'getAll', description: 'List all contacts', action: 'Get many contacts' },
					{ name: 'Update', value: 'update', description: 'Update a contact', action: 'Update a contact' },
				],
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the contact',
				displayOptions: { show: { resource: ['contact'], operation: ['get', 'delete', 'update', 'getDocuments'] } },
			},
			{
				displayName: 'Email',
				name: 'contactEmail',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'contact@email.com',
				description: 'Email of the contact',
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
			},
			{
				displayName: 'Name',
				name: 'contactName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'John Doe',
				description: 'Name of the contact',
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
			},
			{
				displayName: 'Additional Fields',
				name: 'contactAdditionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
				options: [
					{ displayName: 'Phone', name: 'phone', type: 'string', default: '', description: 'Phone number' },
					{ displayName: 'Company', name: 'company', type: 'string', default: '', description: 'Company name' },
				],
			},
			{
				displayName: 'Update Fields',
				name: 'contactUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['contact'], operation: ['update'] } },
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Updated name' },
					{ displayName: 'Email', name: 'email', type: 'string', default: '', description: 'Updated email' },
					{ displayName: 'Phone', name: 'phone', type: 'string', default: '', description: 'Updated phone' },
					{ displayName: 'Company', name: 'company', type: 'string', default: '', description: 'Updated company' },
				],
			},
			{
				displayName: 'Limit',
				name: 'contactLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: { show: { resource: ['contact'], operation: ['getAll', 'getDocuments'] } },
			},
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('allSignApi');
				const baseUrl = (credentials.baseUrl as string) || 'https://api.allsign.io';
				const apiKey = credentials.apiKey as string;

				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						headers: { Authorization: `Bearer ${apiKey}` },
						url: `${baseUrl}/v2/templates`,
						json: true,
					});

					if (Array.isArray(response)) {
						return response.map((t: { name: string; id: string }) => ({
							name: t.name,
							value: t.id,
						}));
					}
					return [{ name: 'No Templates Found', value: '' }];
				} catch {
					return [{ name: 'Could not load templates', value: '' }];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('allSignApi');
		const baseUrl = (credentials.baseUrl as string) || 'https://api.allsign.io';
		const apiKey = credentials.apiKey as string;
		const authHeaders = { Authorization: `Bearer ${apiKey}` };

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'document') {
					// ============ CREATE ============
					if (operation === 'create') {
						const documentName = this.getNodeParameter('documentName', i) as string;
						const fileSource = this.getNodeParameter('fileSource', i) as string;
						const templateId = this.getNodeParameter('templateId', i, '') as string;

						let response;

						if (fileSource === 'url') {
							const fileUrl = this.getNodeParameter('fileUrl', i) as string;
							const body: Record<string, string> = {
								name: documentName,
								file_url: fileUrl,
							};
							if (templateId) body.template_id = templateId;

							response = await this.helpers.httpRequest({
								method: 'POST',
headers: authHeaders,
								url: `${baseUrl}/v2/documents`,
								body,
								json: true,
							});
						} else {
							// Binary upload
							const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
							const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);

							const body: Record<string, string | object> = {
								name: documentName,
								file_data: buffer.toString('base64'),
								file_name: binaryData.fileName || 'document.pdf',
							};

							if (templateId) {
								body.template_id = templateId;
							}

							response = await this.helpers.httpRequest({
								method: 'POST',
headers: authHeaders,
								url: `${baseUrl}/v2/documents`,
								body,
								json: true,
							});
						}

						returnData.push({ json: response as IDataObject });
					}

					// ============ GET ============
					else if (operation === 'get') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ GET ALL ============
					else if (operation === 'getAll') {
						const limit = this.getNodeParameter('limit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/documents`,
							qs: { limit },
							json: true,
						});

						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
					}

					// ============ SEND ============
					else if (operation === 'send') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const signersData = this.getNodeParameter('signers.signerValues', i, []) as Array<{
							name: string;
							email: string;
						}>;
						const message = this.getNodeParameter('message', i, '') as string;

						const body: Record<string, unknown> = {
							signers: signersData,
						};
						if (message) body.message = message;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/send`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ DOWNLOAD ============
					else if (operation === 'download') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const binaryPropertyOutput = this.getNodeParameter('binaryPropertyOutput', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/download`,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});

						const headers = response.headers as Record<string, string>;
						let fileName = `document-${documentId}.pdf`;

						// Try extracting filename from Content-Disposition header
						const contentDisposition = headers['content-disposition'];
						if (contentDisposition) {
							const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
							if (match?.[1]) {
								fileName = match[1];
							}
						}

						const binaryData = await this.helpers.prepareBinaryData(
							response.body as unknown as Buffer,
							fileName,
							(headers['content-type'] as string) || 'application/pdf',
						);

						returnData.push({
							json: { documentId, fileName },
							binary: { [binaryPropertyOutput]: binaryData },
						});
					}

					// ============ VOID ============
					else if (operation === 'void') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const reason = this.getNodeParameter('reason', i, '') as string;

						const body: Record<string, string> = {};
						if (reason) body.reason = reason;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/void`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ DELETE ============
					else if (operation === 'delete') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'DELETE',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}`,
							json: true,
						});
						returnData.push({ json: (response as IDataObject) ?? { success: true, documentId } });
					}

					// ============ UPDATE SIGNATURE VALIDATIONS ============
					else if (operation === 'updateSignatureValidations') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const autografa = this.getNodeParameter('autografa', i) as boolean;
						const fea = this.getNodeParameter('fea', i) as boolean;
						const nom151 = this.getNodeParameter('nom151', i) as boolean;
						const eidas = this.getNodeParameter('eidas', i) as boolean;
						const firmaBiometrica = this.getNodeParameter('firmaBiometrica', i) as boolean;
						const aiVerification = this.getNodeParameter('aiVerification', i) as boolean;
						const confirmNameToFinish = this.getNodeParameter('confirmNameToFinish', i) as boolean;

						const response = await this.helpers.httpRequest({
							method: 'PATCH',
							headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/signature-validations`,
							body: {
								signatureValidations: {
									autografa,
									FEA: fea,
									nom151,
									eIDAS: eidas,
									firmaBiometrica,
									aiVerification,
									confirmNameToFinish,
								},
							},
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ UPDATE SIGNATURE STATE ============
					else if (operation === 'updateSignatureState') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const status = this.getNodeParameter('signatureStatus', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'PATCH',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/signature-state`,
							body: { status },
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ UPDATE (PATCH) ============
					else if (operation === 'update') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						const body: Record<string, unknown> = {};
						if (updateFields.name) body.name = updateFields.name;
						if (updateFields.description) body.description = updateFields.description;
						if (updateFields.folderId !== undefined) body.folderId = updateFields.folderId || null;

						const response = await this.helpers.httpRequest({
							method: 'PATCH',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ GET STATS ============
					else if (operation === 'getStats') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/stats`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ INVITE (V2) ============
					else if (operation === 'invite') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const email = this.getNodeParameter('inviteEmail', i) as string;
						const name = this.getNodeParameter('inviteName', i, '') as string;
						const message = this.getNodeParameter('inviteMessage', i, '') as string;

						const body: Record<string, unknown> = { email };
						if (name) body.name = name;
						if (message) body.message = message;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/invite`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ INVITE BULK (V2) ============
					else if (operation === 'inviteBulk') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const participantsData = this.getNodeParameter('inviteParticipants.participantValues', i, []) as Array<{
							email: string;
							name?: string;
						}>;
						const message = this.getNodeParameter('inviteBulkMessage', i, '') as string;

						const body: Record<string, unknown> = { participants: participantsData };
						if (message) body.message = message;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/invite-bulk`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}
				}

				// ============================================================
				// SIGNER RESOURCE
				// ============================================================
				else if (resource === 'signer') {
					if (operation === 'add') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const signerEmail = this.getNodeParameter('signerEmail', i) as string;
						const invitedByEmail = this.getNodeParameter('invitedByEmail', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/add-signer`,
							body: { signerEmail, invitedByEmail },
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}
				}

				// ============================================================
				// SIGNATURE FIELD RESOURCE
				// ============================================================
				else if (resource === 'signatureField') {
					const documentId = this.getNodeParameter('documentId', i) as string;

					// ============ ADD ============
					if (operation === 'add') {
						const signerEmail = this.getNodeParameter('sfSignerEmail', i) as string;
						const pageNumber = this.getNodeParameter('sfPageNumber', i) as number;
						const additionalFields = this.getNodeParameter('sfAdditionalFields', i, {}) as IDataObject;

						const body: Record<string, unknown> = {
							signerEmail,
							pageNumber,
							...additionalFields,
						};

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/add-signature-field`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ ADD MULTIPLE ============
					else if (operation === 'addMultiple') {
						const fieldsData = this.getNodeParameter('sfFields.fieldValues', i, []) as Array<{
							signerEmail: string;
							pageNumber: number;
							x?: number;
							y?: number;
							width?: number;
							height?: number;
						}>;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/add-signature-fields`,
							body: { fields: fieldsData },
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ UPDATE ============
					else if (operation === 'update') {
						const fieldId = this.getNodeParameter('sfFieldId', i) as string;
						const signerEmail = this.getNodeParameter('sfUpdateSignerEmail', i) as string;
						const updateFields = this.getNodeParameter('sfUpdateFields', i, {}) as IDataObject;

						const body: Record<string, unknown> = {
							fieldId,
							signerEmail,
							...updateFields,
						};

						const response = await this.helpers.httpRequest({
							method: 'PUT',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/update-signature-field`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					// ============ DELETE ============
					else if (operation === 'delete') {
						const fieldId = this.getNodeParameter('sfDeleteFieldId', i) as string;
						const signerEmail = this.getNodeParameter('sfDeleteSignerEmail', i) as string;
						const deleteLinkedFields = this.getNodeParameter('deleteLinkedFields', i) as boolean;

						const response = await this.helpers.httpRequest({
							method: 'DELETE',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/delete-signature-field`,
							body: { fieldId, signerEmail, deleteLinkedFields },
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}
				}

				// ============================================================
				// SIGNATURE RESOURCE
				// ============================================================
				else if (resource === 'signature') {
					if (operation === 'delete') {
						const documentId = this.getNodeParameter('documentId', i) as string;
						const signatureId = this.getNodeParameter('signatureId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'DELETE',
headers: authHeaders,
							url: `${baseUrl}/api/documents/${documentId}/signature/${signatureId}`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}
				}

				// ============================================================
				// FOLDER RESOURCE
				// ============================================================
				else if (resource === 'folder') {
					if (operation === 'getAll') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/folders`,
							json: true,
						});
						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
					}

					else if (operation === 'get') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/folders/${folderId}`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'create') {
						const name = this.getNodeParameter('folderName', i) as string;
						const parentFolderId = this.getNodeParameter('parentFolderId', i, '') as string;
						const body: Record<string, unknown> = { name };
						if (parentFolderId) body.parentFolderId = parentFolderId;

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/folders`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'update') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						const updateFields = this.getNodeParameter('folderUpdateFields', i, {}) as IDataObject;
						const response = await this.helpers.httpRequest({
							method: 'PATCH',
headers: authHeaders,
							url: `${baseUrl}/v2/folders/${folderId}`,
							body: updateFields,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'delete') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						await this.helpers.httpRequest({
							method: 'DELETE',
headers: authHeaders,
							url: `${baseUrl}/v2/folders/${folderId}`,
							json: true,
						});
						returnData.push({ json: { success: true, folderId } });
					}

					else if (operation === 'getDocuments') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						const limit = this.getNodeParameter('folderDocsLimit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/folders/${folderId}/documents`,
							qs: { limit },
							json: true,
						});
						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
					}
				}

				// ============================================================
				// CONTACT RESOURCE
				// ============================================================
				else if (resource === 'contact') {
					if (operation === 'getAll') {
						const limit = this.getNodeParameter('contactLimit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts`,
							qs: { limit },
							json: true,
						});
						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
					}

					else if (operation === 'get') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts/${contactId}`,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'create') {
						const email = this.getNodeParameter('contactEmail', i) as string;
						const name = this.getNodeParameter('contactName', i) as string;
						const additionalFields = this.getNodeParameter('contactAdditionalFields', i, {}) as IDataObject;
						const body: Record<string, unknown> = { email, name, ...additionalFields };

						const response = await this.helpers.httpRequest({
							method: 'POST',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts`,
							body,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'update') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const updateFields = this.getNodeParameter('contactUpdateFields', i, {}) as IDataObject;
						const response = await this.helpers.httpRequest({
							method: 'PATCH',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts/${contactId}`,
							body: updateFields,
							json: true,
						});
						returnData.push({ json: response as IDataObject });
					}

					else if (operation === 'delete') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						await this.helpers.httpRequest({
							method: 'DELETE',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts/${contactId}`,
							json: true,
						});
						returnData.push({ json: { success: true, contactId } });
					}

					else if (operation === 'getDocuments') {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const limit = this.getNodeParameter('contactLimit', i) as number;
						const response = await this.helpers.httpRequest({
							method: 'GET',
headers: authHeaders,
							url: `${baseUrl}/v2/contacts/${contactId}/documents`,
							qs: { limit },
							json: true,
						});
						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({ json: item as IDataObject });
							}
						} else {
							returnData.push({ json: response as IDataObject });
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}

				const err = error as {
					response?: { data?: { message?: string; error?: string }; status?: number };
					message?: string;
					context?: { itemIndex?: number };
				};
				const errorData = err.response?.data || {};
				const apiMessage = errorData.message || errorData.error || err.message || 'Unknown error';

				throw new NodeOperationError(this.getNode(), `AllSign API Error: ${apiMessage}`, {
					itemIndex: i,
					description: `HTTP Status Code: ${err.response?.status || 'N/A'}`,
				});
			}
		}

		return [returnData];
	}
}
