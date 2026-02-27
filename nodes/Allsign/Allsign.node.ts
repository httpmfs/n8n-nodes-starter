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
		subtitle: 'Create & Send Document',
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
			// ====================================================
			// DOCUMENT DETAILS
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
						description: 'Use binary data from a previous node (e.g. Read File, Google Drive, Dropbox)',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Provide a public URL to the PDF file',
					},
				],
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the PDF file',
				displayOptions: {
					show: {
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
						fileSource: ['url'],
					},
				},
			},


			// ====================================================
			// SIGNERS
			// ====================================================
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
				options: [
					{
						name: 'signerValues',
						displayName: 'Signer',
						values: [
							{
								displayName: 'Country Code',
								name: 'countryCode',
								type: 'options',
								default: '+52',
								description: "Country code for the signer's WhatsApp number",
								options: [
									{ name: '🇦🇷 Argentina (+54)', value: '+54' },
									{ name: '🇧🇷 Brazil (+55)', value: '+55' },
									{ name: '🇨🇱 Chile (+56)', value: '+56' },
									{ name: '🇨🇴 Colombia (+57)', value: '+57' },
									{ name: '🇨🇷 Costa Rica (+506)', value: '+506' },
									{ name: '🇪🇨 Ecuador (+593)', value: '+593' },
									{ name: '🇪🇸 Spain (+34)', value: '+34' },
									{ name: '🇬🇹 Guatemala (+502)', value: '+502' },
									{ name: '🇲🇽 Mexico (+52)', value: '+52' },
									{ name: '🇵🇦 Panama (+507)', value: '+507' },
									{ name: '🇵🇪 Peru (+51)', value: '+51' },
									{ name: '🇺🇸 United States (+1)', value: '+1' },
									{ name: '🔢 Custom', value: 'custom' },
								],
							},
							{
								displayName: 'Custom Country Code',
								name: 'customCountryCode',
								type: 'string',
								default: '',
								placeholder: '+44',
								description: 'Enter the country code manually (e.g. +44 for UK)',
								displayOptions: {
									show: {
										countryCode: ['custom'],
									},
								},
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
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								required: true,
								description: 'Full name of the signer',
							},
							{
								displayName: 'Phone Number',
								name: 'phoneNumber',
								type: 'string',
								default: '',
								placeholder: '5512345678',
								description:
									'WhatsApp phone number without country code. Required if WhatsApp Notification is enabled.',
							},
						],
					},
				],
			},

			// ====================================================
			// SIGNATURE FIELDS
			// ====================================================
			{
				displayName: 'Signature Fields',
				name: 'signatureFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Signature Field',
				description:
					'Define where signatures should be placed on the document. If empty, signers will need to place fields manually.',
				options: [
					{
						name: 'fieldValues',
						displayName: 'Field',
						values: [
							{
								displayName: 'All Pages',
								name: 'includeInAllPages',
								type: 'boolean',
								default: false,
								description:
									'Whether to place this field on every page of the document',
								displayOptions: {
									show: {
										placementMode: ['coordinates'],
									},
								},
							},
							{
								displayName: 'Anchor Text',
								name: 'anchorString',
								type: 'string',
								default: '',
								placeholder: 'e.g. Firma del Cliente',
								description:
									'Text to search for in the PDF — the signature field will be placed where this text appears',
								displayOptions: {
									show: {
										placementMode: ['anchor'],
									},
								},
							},
							{
								displayName: 'Height',
								name: 'height',
								type: 'number',
								default: 100,
								description:
									'Height of the signature field in points. Width is auto-calculated (2:1 ratio).',
							},
							{
								displayName: 'Page Number',
								name: 'pageNumber',
								type: 'number',
								default: 1,
								typeOptions: {
									minValue: 1,
								},
								description:
									'Page where the signature field should be placed (starts at 1). Ignored when All Pages is enabled.',
								displayOptions: {
									show: {
										placementMode: ['coordinates'],
									},
								},
							},
							{
								displayName: 'Placement Mode',
								name: 'placementMode',
								type: 'options',
								default: 'coordinates',
								options: [
									{
										name: 'Anchor Text',
										value: 'anchor',
										description:
											'Place field where a specific text is found in the PDF',
									},
									{
										name: 'Coordinates (X, Y)',
										value: 'coordinates',
										description: 'Place field at specific X, Y coordinates on a page',
									},
								],
							},
							{
								displayName: 'Signer Email',
								name: 'participantEmail',
								type: 'string',
								default: '',
								required: true,
								placeholder: 'name@email.com',
								description:
									'Email of the signer this field belongs to (must match a signer email above)',
							},
							{
								displayName: 'X Position',
								name: 'x',
								type: 'number',
								default: 100,
								description: 'Horizontal position in points from left edge of page',
								displayOptions: {
									show: {
										placementMode: ['coordinates'],
									},
								},
							},
							{
								displayName: 'Y Position',
								name: 'y',
								type: 'number',
								default: 500,
								description: 'Vertical position in points from top edge of page',
								displayOptions: {
									show: {
										placementMode: ['coordinates'],
									},
								},
							},
						],
					},
				],
			},

			// ------ Folder Name ------
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				placeholder: 'e.g. Contracts 2026',
				description:
					'Name of the folder where the document will be stored. Leave empty to use the default location.',
			},

			// ====================================================
			// 📨 NOTIFICATION CONFIGURATION (collapsible)
			// ====================================================
			{
				displayName: 'Notify Signers',
				name: 'sendInvitations',
				type: 'boolean',
				default: true,
				description:
					'Whether to send signing links to each signer after the document is created. If disabled, you will need to share the signing links manually.',
			},
			{
				displayName: 'Notification Channels',
				name: 'sendInviteConfig',
				type: 'collection',
				placeholder: 'Add Channel',
				default: {},
				description:
					'Choose how signers receive their signing links — via email, WhatsApp, or both',
				displayOptions: {
					show: {
						sendInvitations: [true],
					},
				},
				options: [
					{
						displayName: 'Email Notification',
						name: 'sendByEmail',
						type: 'boolean',
						default: true,
						description:
							'Whether to send each signer an email with a direct link to sign the document',
					},
					{
						displayName: 'WhatsApp Notification',
						name: 'sendByWhatsapp',
						type: 'boolean',
						default: false,
						description:
							'Whether to send each signer a WhatsApp message with a direct link to sign the document (requires a phone number on each signer)',
					},
				],
			},

			// ====================================================
			// 🔐 SIGNATURE VALIDATIONS (collapsible)
			// ====================================================
			{
				displayName: 'Signature Validations',
				name: 'signatureValidations',
				type: 'collection',
				placeholder: 'Add Validation',
				default: {},
				description:
					'Signature types and verification methods for legal validity and security',
				options: [
					{
						displayName: 'Autógrafa (Handwritten Signature)',
						name: 'verifyAutografa',
						type: 'boolean',
						default: false,
						description:
							'Whether to require a handwritten-style digital signature with biometric capture',
					},
					{
						displayName: 'Biometric Selfie',
						name: 'verifyBiometricSelfie',
						type: 'boolean',
						default: false,
						description:
							'Whether to require a biometric selfie for identity matching (requires Identity Verification)',
					},
					{
						displayName: 'Confirm Name',
						name: 'verifyConfirmName',
						type: 'boolean',
						default: false,
						description:
							'Whether to require the signer to type their full name as confirmation',
					},
					{
						displayName: 'FEA (Advanced Electronic Signature)',
						name: 'verifyFea',
						type: 'boolean',
						default: false,
						description:
							'Whether to require FEA (Firma Electrónica Avanzada) verification',
					},
					{
						displayName: 'ID Scan',
						name: 'verifyIdScan',
						type: 'boolean',
						default: false,
						description:
							'Whether to require signers to scan their government-issued ID (requires Identity Verification)',
					},
					{
						displayName: 'Identity Verification',
						name: 'verifyIdentity',
						type: 'boolean',
						default: false,
						description:
							'Whether to require identity verification for signers',
					},
					{
						displayName: 'NOM-151 (Timestamping)',
						name: 'verifyNom151',
						type: 'boolean',
						default: false,
						description:
							'Whether to apply NOM-151 certified timestamping to the document',
					},
					{
						displayName: 'SynthID (AI Detection)',
						name: 'verifySynthId',
						type: 'boolean',
						default: false,
						description:
							'Whether to verify the selfie was taken by a real person and not AI-generated (requires Biometric Selfie)',
					},
					{
						displayName: 'Video Signature',
						name: 'verifyVideo',
						type: 'boolean',
						default: false,
						description:
							'Whether to require a recorded video as part of the signing process',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('allSignApi');
		const baseUrl = ((credentials.baseUrl as string) || 'https://api.allsign.io').replace(
			/\/+$/,
			'',
		);
		const apiKey = credentials.apiKey as string;
		const authHeaders = { Authorization: `Bearer ${apiKey}` };

		for (let i = 0; i < items.length; i++) {
			try {
				const documentName = this.getNodeParameter('documentName', i) as string;
				const fileSource = this.getNodeParameter('fileSource', i) as string;

				const signersData = this.getNodeParameter('signers.signerValues', i, []) as Array<{
					name: string;
					email: string;
					countryCode?: string;
					customCountryCode?: string;
					phoneNumber?: string;
				}>;

				// Send Invite Configuration (from collapsible collection)
				const sendInvitations = this.getNodeParameter('sendInvitations', i, true) as boolean;
				const sendInviteConfig = sendInvitations
					? (this.getNodeParameter('sendInviteConfig', i, {}) as IDataObject)
					: {};
				const sendByEmail = (sendInviteConfig.sendByEmail as boolean) ?? true;
				const sendByWhatsapp = (sendInviteConfig.sendByWhatsapp as boolean) ?? false;

				// Signature Validations (from collapsible collection)
				const sigValidations = this.getNodeParameter('signatureValidations', i, {}) as IDataObject;
				const verifyAutografa = (sigValidations.verifyAutografa as boolean) ?? false;
				const verifyFea = (sigValidations.verifyFea as boolean) ?? false;
				const verifyNom151 = (sigValidations.verifyNom151 as boolean) ?? false;
				const verifyVideo = (sigValidations.verifyVideo as boolean) ?? false;
				const verifyConfirmName = (sigValidations.verifyConfirmName as boolean) ?? false;
				const verifyIdentity = (sigValidations.verifyIdentity as boolean) ?? false;
				const verifyIdScan = (sigValidations.verifyIdScan as boolean) ?? false;
				const verifyBiometricSelfie = (sigValidations.verifyBiometricSelfie as boolean) ?? false;
				const verifySynthId = (sigValidations.verifySynthId as boolean) ?? false;

				// Signature fields
				const fieldsData = this.getNodeParameter(
					'signatureFields.fieldValues',
					i,
					[],
				) as Array<{
					participantEmail: string;
					placementMode: string;
					x?: number;
					y?: number;
					pageNumber?: number;
					includeInAllPages?: boolean;
					anchorString?: string;
					height?: number;
				}>;

				// Folder name (optional)
				const folderName = this.getNodeParameter('folderName', i, '') as string;

				// Get file as base64
				let fileBase64: string;
				let fileName: string;

				if (fileSource === 'url') {
					const fileUrl = this.getNodeParameter('fileUrl', i) as string;
					// Download the file and convert to base64
					const fileBuffer = (await this.helpers.httpRequest({
						method: 'GET',
						url: fileUrl,
						encoding: 'arraybuffer',
						returnFullResponse: false,
					})) as Buffer;
					fileBase64 = Buffer.from(fileBuffer).toString('base64');
					// Extract filename from URL or use default
					const urlParts = fileUrl.split('/');
					fileName = urlParts[urlParts.length - 1] || 'document.pdf';
				} else {
					// Binary upload — automatically converted to base64
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
					if (verifyBiometricSelfie) {
						signatureValidation.ai_verification = verifySynthId;
					}
					if (verifyIdScan) signatureValidation.ai_verification = true;
				}

				// Build participants from signers (include whatsapp if provided)
				const participants = signersData.map((signer) => {
					const participant: Record<string, string> = {
						email: signer.email,
						name: signer.name,
					};
					if (signer.phoneNumber && signer.phoneNumber.trim() !== '') {
						const code = signer.countryCode === 'custom'
							? (signer.customCountryCode || '+52')
							: (signer.countryCode || '+52');
						participant.whatsapp = `${code}${signer.phoneNumber.trim()}`;
					}
					return participant;
				});

				// Build signature fields
				const fields = fieldsData.map((field) => {
					if (field.placementMode === 'anchor') {
						return {
							participantEmail: field.participantEmail,
							anchorString: field.anchorString || '',
							height: field.height || 100,
						};
					}
					// Coordinate placement
					const fieldObj: Record<string, unknown> = {
						participantEmail: field.participantEmail,
						position: {
							x: field.x ?? 100,
							y: field.y ?? 500,
						},
						height: field.height || 100,
					};
					if (field.includeInAllPages) {
						fieldObj.includeInAllPages = true;
					} else {
						fieldObj.pageNumber = field.pageNumber || 1;
					}
					return fieldObj;
				});

				// Step 1: Create document WITHOUT sending invitations
				// Invitations are sent separately via invite-bulk endpoint
				// which uses the new GuestSession flow with correct WhatsApp template
				const hasParticipants = participants.length > 0;
				const startAtStep = hasParticipants ? 2 : 1;

				const body: Record<string, unknown> = {
					document: {
						base64Content: fileBase64,
						name: fileName.endsWith('.pdf') ? fileName : `${documentName}.pdf`,
					},
					participants,
					signatureValidation,
					config: {
						sendInvitations: false,
						sendByEmail: false,
						sendByWhatsapp: false,
						startAtStep,
					},
				};

				// Only include fields if any were defined
				if (fields.length > 0) {
					body.fields = fields;
				}

				// Include folder name if specified
				if (folderName.trim()) {
					body.folderName = folderName.trim();
				}

				const createResponse = (await this.helpers.httpRequest({
					method: 'POST',
					headers: authHeaders,
					url: `${baseUrl}/v2/documents/`,
					body,
					json: true,
				})) as IDataObject;

				const documentId = createResponse.id as string;

				// Step 2: Send invitations via invite-bulk (new GuestSession flow)
				if (sendInvitations && hasParticipants && documentId) {
					const inviteBody = {
						participants: participants.map((p) => {
							const part: Record<string, string> = { email: p.email };
							if (p.whatsapp) part.whatsapp = p.whatsapp;
							if (p.name) part.name = p.name;
							return part;
						}),
						config: {
							sendInvitationByEmail: sendByEmail,
							sendInvitationByWhatsapp: sendByWhatsapp,
							invitedByEmail: participants[0]?.email || '',
						},
					};

					try {
						const inviteResponse = (await this.helpers.httpRequest({
							method: 'POST',
							headers: authHeaders,
							url: `${baseUrl}/v2/documents/${documentId}/invite-bulk`,
							body: inviteBody,
							json: true,
						})) as IDataObject;

						createResponse.invitations = inviteResponse;
					} catch (inviteError) {
						const invErr = inviteError as { message?: string };
						createResponse.invitationError =
							invErr.message || 'Failed to send invitations';
					}
				}

				returnData.push({ json: createResponse });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}

				const err = error as {
					response?: {
						data?: { message?: string; error?: string; detail?: string | object };
						status?: number;
					};
					message?: string;
					context?: { itemIndex?: number };
				};
				const errorData = err.response?.data || {};
				let apiMessage =
					errorData.message || errorData.error || err.message || 'Unknown error';

				// Handle detail field (AllSign returns errors in detail)
				if (errorData.detail) {
					if (typeof errorData.detail === 'string') {
						apiMessage = errorData.detail;
					} else {
						apiMessage = JSON.stringify(errorData.detail);
					}
				}

				throw new NodeOperationError(
					this.getNode(),
					`AllSign API Error: ${apiMessage}`,
					{
						itemIndex: i,
						description: `HTTP Status Code: ${err.response?.status || 'N/A'}`,
					},
				);
			}
		}

		return [returnData];
	}
}
