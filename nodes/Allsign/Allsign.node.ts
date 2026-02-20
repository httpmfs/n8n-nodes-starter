import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
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
						name: 'Document',
						value: 'document',
						description: 'Create, send, and manage documents for signing',
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
				default: 'createAndSend',
				options: [
					{
						name: 'Create & Send',
						value: 'createAndSend',
						description: 'Upload a document and send it for signing in one step',
						action: 'Create and send a document',
					},
				],
			},

			// ====================================================
			// CREATE & SEND fields
			// ====================================================

			// ------ Document Name ------
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
						operation: ['createAndSend'],
					},
				},
			},

			// ------ File Source ------
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
						operation: ['createAndSend'],
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
						operation: ['createAndSend'],
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
						operation: ['createAndSend'],
						fileSource: ['url'],
					},
				},
			},



			// ====== SIGNERS ======
			{
				displayName: 'Signers',
				name: 'signers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				required: true,
				placeholder: 'Add Signer',
				description: 'People who need to sign the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
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
								required: true,
								description: 'Full name of the signer',
							},
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								placeholder: 'name@email.com',
								default: '',
								required: true,
								description: 'Email address of the signer',
							},
						],
					},
				],
			},

			// ====== SIGNATURE OPTIONS ======
			{
				displayName: 'Autógrafa (Handwritten Signature)',
				name: 'verifyAutografa',
				type: 'boolean',
				default: false,
				description: 'Whether to require a handwritten-style digital signature with biometric capture',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},

			// ====== VERIFICATION OPTIONS ======
			{
				displayName: 'FEA (Advanced Electronic Signature)',
				name: 'verifyFea',
				type: 'boolean',
				default: false,
				description: 'Whether to require FEA (Firma Electrónica Avanzada) verification',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},
			{
				displayName: 'NOM-151 (Timestamping)',
				name: 'verifyNom151',
				type: 'boolean',
				default: false,
				description: 'Whether to apply NOM-151 certified timestamping to the document',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},
			{
				displayName: 'Video Signature',
				name: 'verifyVideo',
				type: 'boolean',
				default: false,
				description: 'Whether to require a recorded video as part of the signing process',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},
			{
				displayName: 'Confirm Name',
				name: 'verifyConfirmName',
				type: 'boolean',
				default: false,
				description: 'Whether to require the signer to type their full name as confirmation',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},

			// ====== IDENTITY VERIFICATION (parent toggle) ======
			{
				displayName: 'Identity Verification',
				name: 'verifyIdentity',
				type: 'boolean',
				default: false,
				description: 'Whether to require identity verification for signers',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
					},
				},
			},

			// ------ ID Scan (child of Identity Verification) ------
			{
				displayName: 'ID Scan',
				name: 'verifyIdScan',
				type: 'boolean',
				default: false,
				description: 'Whether to require signers to scan their government-issued ID',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
						verifyIdentity: [true],
					},
				},
			},

			// ------ Biometric Selfie (child of Identity Verification) ------
			{
				displayName: 'Biometric Selfie',
				name: 'verifyBiometricSelfie',
				type: 'boolean',
				default: false,
				description: 'Whether to require a biometric selfie for identity matching',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
						verifyIdentity: [true],
					},
				},
			},

			// ------ SynthID (child of Biometric Selfie) ------
			{
				displayName: 'SynthID (AI Detection)',
				name: 'verifySynthId',
				type: 'boolean',
				default: false,
				description: 'Whether to verify the selfie was taken by a real person and not AI-generated',
				displayOptions: {
					show: {
						resource: ['document'],
						operation: ['createAndSend'],
						verifyIdentity: [true],
						verifyBiometricSelfie: [true],
					},
				},
			},
		],
	};



	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = await this.getCredentials('allSignApi');
		const baseUrl = ((credentials.baseUrl as string) || 'https://api.allsign.io').replace(/\/+$/, '');
		const apiKey = credentials.apiKey as string;
		const authHeaders = { Authorization: `Bearer ${apiKey}` };

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'document') {
					// ============ CREATE & SEND ============
					if (operation === 'createAndSend') {
						const documentName = this.getNodeParameter('documentName', i) as string;
						const fileSource = this.getNodeParameter('fileSource', i) as string;

						const signersData = this.getNodeParameter('signers.signerValues', i, []) as Array<{
							name: string;
							email: string;
						}>;
						const verifyAutografa = this.getNodeParameter('verifyAutografa', i, false) as boolean;
						const verifyFea = this.getNodeParameter('verifyFea', i, false) as boolean;
						const verifyNom151 = this.getNodeParameter('verifyNom151', i, false) as boolean;
						const verifyVideo = this.getNodeParameter('verifyVideo', i, false) as boolean;
						const verifyConfirmName = this.getNodeParameter('verifyConfirmName', i, false) as boolean;
						const verifyIdentity = this.getNodeParameter('verifyIdentity', i, false) as boolean;

						// Get file as base64
						let fileBase64: string;
						let fileName: string;

						if (fileSource === 'url') {
							const fileUrl = this.getNodeParameter('fileUrl', i) as string;
							// Download the file and convert to base64
							const fileBuffer = await this.helpers.httpRequest({
								method: 'GET',
								url: fileUrl,
								encoding: 'arraybuffer',
								returnFullResponse: false,
							}) as Buffer;
							fileBase64 = Buffer.from(fileBuffer).toString('base64');
							// Extract filename from URL or use default
							const urlParts = fileUrl.split('/');
							fileName = urlParts[urlParts.length - 1] || 'document.pdf';
						} else {
							// Binary upload
							const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, binaryProperty);
							const buffer = await this.helpers.getBinaryDataBuffer(i, binaryProperty);
							fileBase64 = buffer.toString('base64');
							fileName = binaryData.fileName || 'document.pdf';
						}

						// Build signatureValidation from toggle options
						const signatureValidation: Record<string, boolean> = {
							autografa: verifyAutografa,
							FEA: verifyFea,
							nom151: verifyNom151,
							biometric_signature: verifyVideo,
							confirm_name_to_finish: verifyConfirmName,
						};

						if (verifyIdentity) {
							const verifyIdScan = this.getNodeParameter('verifyIdScan', i, false) as boolean;
							const verifyBiometricSelfie = this.getNodeParameter('verifyBiometricSelfie', i, false) as boolean;
							if (verifyBiometricSelfie) {
								const verifySynthId = this.getNodeParameter('verifySynthId', i, false) as boolean;
								signatureValidation.ai_verification = verifySynthId;
							}
							// ID scan and biometric selfie are handled by the platform
							if (verifyIdScan) signatureValidation.ai_verification = true;
						}

						// Build participants from signers
						const participants = signersData.map((signer) => ({
							email: signer.email,
							name: signer.name,
						}));

						// Build the body matching DocumentCreateRequestV2 schema
						const body: Record<string, unknown> = {
							document: {
								base64Content: fileBase64,
								name: fileName.endsWith('.pdf') ? fileName : `${documentName}.pdf`,
							},
							participants,
							signatureValidation,
							config: {
								sendInvitations: participants.length > 0,
								sendByEmail: participants.length > 0,
								startAtStep: participants.length > 0 ? 3 : 1,
							},
						};



						const response = await this.helpers.httpRequest({
							method: 'POST',
							headers: authHeaders,
							url: `${baseUrl}/v2/documents/`,
							body,
							json: true,
						});

						returnData.push({ json: response as IDataObject });
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
