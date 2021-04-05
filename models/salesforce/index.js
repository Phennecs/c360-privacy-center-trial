const jsforce = require('jsforce');
const { SFInvalidTypeError } = require('../../errors');
const { sfApiVersion } = require('../../settings');

const { namespace } = require('../../settings');
const dedupArray = require('../../utils/dedup-array');

class SalesforceModel {

    constructor() {

    }

    async authenticateSalesforce() {

        const oauth2 = new jsforce.OAuth2({
            loginUrl: process.env.SF_LOGIN_URL,
            clientId: process.env.SF_CLIENT_ID,
            // clientSecret: process.env.SF_CLIENT_SECRET_ID,
            redirectUri: process.env.SF_REDIRECT_URI
        });

        const conn = new jsforce.Connection({
            oauth2 : oauth2,
            accessToken: process.env.SF_ACCESS_TOKEN,
            refreshToken: process.env.SF_REFRESH_TOKEN,
            instanceUrl: process.env.SF_INSTANCE_URL,
            version: sfApiVersion
        });

        conn.on("refresh", function(accessToken, res) {

            // console.log(`REFRESH OCCURRED - probably need to set config vars again...`);

        });

        return conn;
    }

    async runQueryChain(conn, query) {

        // If the query results are high in count, the first request returns done = false and a nextRecordsUrl. Use queryMore until we are done.
        let res = await conn.query(query);

        if (res.done === true) {
            return res;
        }

        // Populate the combined records with an initial copy of array elements from the first result
        const combinedRecords = res.records.map(rec => rec);

        let i = 1; // Including request above as first
        while (res && res.done === false) {
            i++;
            console.log(`Running queryMore for result set #: ${i}`);
            res = await conn.queryMore(res.nextRecordsUrl);
            res.records.forEach(rec => combinedRecords.push(rec));
        }

        // Overwrite last response's records with the combined set from all requests
        res.records = combinedRecords;

        return res;
    }

    async getQuery(query) {

        const conn = await this.authenticateSalesforce();
        console.log(`cache query : ${query}`);

        return await this.runQueryChain(conn, query);
    }

    async getActivePolicies() {

        const conn = await this.authenticateSalesforce();
        const activePoliciesQuery = `SELECT Id, DeveloperName, MasterLabel, Label, ${namespace}Active__c, ${namespace}Created_By__c, ${namespace}Created_Date__c, ${namespace}Notes__c, ${namespace}Status__c, ${namespace}Last_Edit_By__c, ${namespace}Last_Edit__c FROM ${namespace}Data_Policy__mdt WHERE ${namespace}Active__c = true ORDER BY MasterLabel ASC`;
        return await this.runQueryChain(conn, activePoliciesQuery);

    }

    async getAllPolicies(activeOnly = true) {

        const conn = await this.authenticateSalesforce();
        const policiesQuery = `SELECT Id, DeveloperName, MasterLabel, Label, ${namespace}Active__c, ${namespace}Created_By__c, ${namespace}Created_Date__c, ${namespace}Notes__c, ${namespace}Status__c, ${namespace}Last_Edit_By__c, ${namespace}Last_Edit__c FROM ${namespace}Data_Policy__mdt ${activeOnly ? `WHERE ${namespace}Active__c = true` : ''} ORDER BY DeveloperName ASC`;
        return await this.runQueryChain(conn, policiesQuery);

    }

    async getPolicyByName(developerName, activeOnly = true) {

        // console.log(`getPolicyByName: ${developerName}`);
        const conn = await this.authenticateSalesforce();
        const policyByName = `SELECT Id, DeveloperName, MasterLabel, Label, ${namespace}Active__c, ${namespace}Created_By__c, ${namespace}Created_Date__c, ${namespace}Notes__c, ${namespace}Status__c, ${namespace}Last_Edit_By__c, ${namespace}Last_Edit__c FROM ${namespace}Data_Policy__mdt WHERE ${activeOnly ? `${namespace}Active__c = true AND` : ''} DeveloperName = '${developerName}' ORDER BY MasterLabel ASC`;
        // console.log(`getPolicyByName SOQL: ${policyByName}`);
        return await this.runQueryChain(conn, policyByName);
    }

    async getObjectsByPolicyId(policyId, activeOnly = true) {

        const conn = await this.authenticateSalesforce();
        try {
            const objectsPerPolicy = `SELECT Id, DeveloperName, Label, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Record_Retention__c, ${namespace}Child_Object__c, ${namespace}Hard_Delete__c, ${namespace}Data_Policy__c, ${namespace}Record_Count__c, ${namespace}Master_Object__c, ${namespace}Parent_Object_API_Name__c, ${namespace}Parent_Object_ID__c, ${namespace}Filter_Enabled__c, ${namespace}Raw_Filter_Data__c, ${namespace}Where_Criteria_LT__c, ${namespace}Where_Criteria_PG_LT__c, ${namespace}Where_Criteria_PG_Cache_LT__c FROM ${namespace}Data_Object__mdt WHERE ${activeOnly ? `${namespace}Active__c = true AND` : ''} ${namespace}Data_Policy__c = '${policyId}' ORDER BY ${namespace}API_Name__c ASC`;
            return await this.runQueryChain(conn, objectsPerPolicy);
        } catch (err) {
            console.log(`Error: `, err);
            if (err.errorCode == 'INVALID_FIELD') {
                // Same query without hardDelete field
                const objectsPerPolicy2 = `SELECT Id, DeveloperName, Label, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Record_Retention__c, ${namespace}Child_Object__c, ${namespace}Data_Policy__c, ${namespace}Record_Count__c, ${namespace}Master_Object__c, ${namespace}Parent_Object_API_Name__c, ${namespace}Parent_Object_ID__c, ${namespace}Filter_Enabled__c, ${namespace}Raw_Filter_Data__c, ${namespace}Where_Criteria_LT__c, ${namespace}Where_Criteria_PG_LT__c, ${namespace}Where_Criteria_PG_Cache_LT__c FROM ${namespace}Data_Object__mdt WHERE ${activeOnly ? `${namespace}Active__c = true AND` : ''} ${namespace}Data_Policy__c = '${policyId}' ORDER BY ${namespace}API_Name__c ASC`;
                return await this.runQueryChain(conn, objectsPerPolicy2);
            } else {
                throw err;
            }
        }

    }

    async getAllObjects(activeOnly = true) {

        const conn = await this.authenticateSalesforce();
        try {
            const objectsQuery = `SELECT Id, DeveloperName, Label, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Record_Retention__c, ${namespace}Child_Object__c, ${namespace}Hard_Delete__c, ${namespace}Data_Policy__c, ${namespace}Record_Count__c, ${namespace}Master_Object__c, ${namespace}Parent_Object_API_Name__c, ${namespace}Parent_Object_ID__c, ${namespace}Filter_Enabled__c, ${namespace}Raw_Filter_Data__c, ${namespace}Where_Criteria_LT__c, ${namespace}Where_Criteria_PG_LT__c, ${namespace}Where_Criteria_PG_Cache_LT__c FROM ${namespace}Data_Object__mdt ${activeOnly ? `WHERE ${namespace}Active__c = true` : ''} ORDER BY ${namespace}API_Name__c ASC`;
            return await this.runQueryChain(conn, objectsQuery);
        } catch (err) {
            console.log(`Error: `, err);
            if (err.errorCode == 'INVALID_FIELD') {
                // Same query without hardDelete field
                const objectsQuery2 = `SELECT Id, DeveloperName, Label, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Record_Retention__c, ${namespace}Child_Object__c, ${namespace}Data_Policy__c, ${namespace}Record_Count__c, ${namespace}Master_Object__c, ${namespace}Parent_Object_API_Name__c, ${namespace}Parent_Object_ID__c, ${namespace}Filter_Enabled__c, ${namespace}Raw_Filter_Data__c, ${namespace}Where_Criteria_LT__c, ${namespace}Where_Criteria_PG_LT__c, ${namespace}Where_Criteria_PG_Cache_LT__c FROM ${namespace}Data_Object__mdt ${activeOnly ? `WHERE ${namespace}Active__c = true` : ''} ORDER BY ${namespace}API_Name__c ASC`;
                return await this.runQueryChain(conn, objectsQuery2);
            } else {
                throw err;
            }
        }
    }

    async getFieldsByObjectIds(objectIds, activeOnly = true) {

        // console.log(`sf objectIds:`, objectIds);
        const objectIdsInClause = '(' + dedupArray(objectIds.map(id => `'${id}'`)).join(', ') + ')';

        const conn = await this.authenticateSalesforce();
        const fieldsByObjectIds = `SELECT Id, DeveloperName, Label, ${namespace}Data_Object__c, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Custom__c, ${namespace}Field_Length__c, ${namespace}Field_Type__c, ${namespace}Masking_Category__c, ${namespace}Masking_Type__c, ${namespace}Range_Max__c, ${namespace}Range_Min__c, ${namespace}Required__c, ${namespace}Unique__c, ${namespace}Date_Max__c, ${namespace}Date_Min__c, ${namespace}Data_Object__r.${namespace}API_Name__c, ${namespace}Index_Number__c FROM ${namespace}Data_Field__mdt WHERE ${namespace}Data_Object__c IN ${objectIdsInClause} ${activeOnly ? `AND ${namespace}Active__c = true` : ''}`;
        return await this.runQueryChain(conn, fieldsByObjectIds);
    }

    async getAllFields(activeOnly = true) {

        const conn = await this.authenticateSalesforce();
        const fieldsQuery = `SELECT Id, DeveloperName, Label, ${namespace}Data_Object__c, ${namespace}Active__c, ${namespace}API_Name__c, ${namespace}Custom__c, ${namespace}Field_Length__c, ${namespace}Field_Type__c, ${namespace}Masking_Category__c, ${namespace}Masking_Type__c, ${namespace}Range_Max__c, ${namespace}Range_Min__c, ${namespace}Required__c, ${namespace}Unique__c, ${namespace}Date_Max__c, ${namespace}Date_Min__c, ${namespace}Data_Object__r.${namespace}API_Name__c, ${namespace}Index_Number__c FROM ${namespace}Data_Field__mdt ${activeOnly ? `WHERE ${namespace}Active__c = true` : ''} ORDER BY ${namespace}API_Name__c ASC`;
        // conn.autoFetch(true);
        return await this.runQueryChain(conn, fieldsQuery);
    }

    async getAllParts(activeOnly = true) {
        const policies = await this.getAllPolicies(activeOnly);
        // console.log(`policies => ${JSON.stringify(policies, undefined, 2)}`);

        const objects = await this.getAllObjects(activeOnly);
        // console.log(`objects => ${JSON.stringify(objects, undefined, 2)}`);

        const fields = await this.getAllFields(activeOnly);
        // console.log(`fields => ${JSON.stringify(fields, undefined, 2)}`);

        return {
            policies,
            objects,
            fields
        };
    }

    async getAllPartsByPolicyName(policyName, activeOnly = true) {

        let policies, objects, fields;

        policies = await this.getPolicyByName(policyName, activeOnly);
        // console.log(`policies => ${JSON.stringify(policies, undefined, 2)}`);

        if (policies.totalSize < 1) {
            return { policies, objects, fields };
        }

        const policyId = policies.records[0].Id;
        objects = await this.getObjectsByPolicyId(policyId, activeOnly);
        // console.log(`objects => ${JSON.stringify(objects, undefined, 2)}`);

        if (objects.totalSize < 1) {
            return { policies, objects, fields };
        }

        fields = await this.getFieldsByObjectIds(objects.records.map(object => object.Id), activeOnly);
        // console.log(`fields => ${JSON.stringify(fields, undefined, 2)}`);

        return {
            policies,
            objects,
            fields
        };
    }

    async insertRunLog(executionId, policyName, logStatus, logType, logMessage) {
        try {
            await this.insertRunLogImpl(executionId, policyName, logStatus, logType, logMessage);
            return true;
        } catch (err) {
            if (err instanceof SFInvalidTypeError) {
                console.warn(`Attempting to insert run log to alternate namespace!`);
                try {
                    await this.insertRunLogImpl(executionId, policyName, 'Error', 'General', `Failure to insert a default-namespaced run log. Please check the namespace settings in heroku.`, true);
                } catch (err2) {
                    console.error(`Error inserting alternate runlog.`, err2);
                }
            } else {
                console.error(`Error inserting runlog.`, err);
            }
            return false;
        }
    }

    async insertRunLogImpl(executionId, policyName, logStatus, logType, logMessage, switchNamespace = false) {

        // switchNamespace is here to handle a specific case. Whenever a package has the wrong namespace setting in heroku, we won't be able to insert a failure run log.
        // So for that case, we try to insert one to the opposite namespace as well to force a run log through.
        let ns = namespace;
        if (switchNamespace) {
            ns = namespace == '' ? 'privacycenter__' : '';
        }

        let conn = await this.authenticateSalesforce();
        return await conn.sobject(`${ns}Masking_Execution_Log__c`).create({
            [`${ns}Masking_Execution_Id__c`] : executionId,
            [`${ns}Configuration_Name__c`] : policyName,
            [`${ns}Status__c`] : logStatus,
            [`${ns}Type__c`] : logType,
            [`${ns}Message__c`] : logMessage
        }, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            // console.log('Created Successfully');
        });

    }

    async retrieveObjectsByIds(objectIds) {

        let conn = await this.authenticateSalesforce();

        return new Promise ((resolve, reject) => {
            // Multiple records update
            conn.sobject(`${namespace}Data_Object__mdt`).retrieve(objectIds,
                function(err, rets) {
                    if (err) {
                        console.error(`Error retrieve custom metadata records for ${namespace}Data_Object__mdt!`, err);
                        reject(err);
                    }
                    resolve(rets);
                }
            );
        });
    }

    async retrieveRunlogs(options = {}) {
        const limit = options.limit ? options.limit : 200;

        const objName = `${namespace}Masking_Execution_Log__c`;

        let conn = await this.authenticateSalesforce();

        // [`${ns}Masking_Execution_Id__c`] : executionId,
        // [`${ns}Configuration_Name__c`] : policyName,
        // [`${ns}Status__c`] : logStatus,
        // [`${ns}Type__c`] : logType,
        // [`${ns}Message__c`] : logMessage

        // conditions for find
        const conditions = {};

        if (options.executionId) conditions[`${namespace}Masking_Execution_Id__c`] = options.executionId;

        return new Promise ((resolve, reject) => {

            conn.sobject(objName)
                .find(
                    // conditions for find
                    conditions,
                    // fields to return in JSON object
                    [
                        'Id',
                        'Name', // Run Log Autonumber, highest number is latest entry
                        `${namespace}Masking_Execution_Id__c`,
                        `${namespace}Configuration_Name__c`,
                        `${namespace}Status__c`,
                        `${namespace}Type__c`,
                        `${namespace}Message__c`
                    ])
                .sort({ Name: -1 })
                .limit(limit)
                // .skip(10)
                .execute(function(err, records) {
                    if (err) {
                        console.error(`Error retrieving run log records for ${namespace}Masking_Execution_Log__c!`, err);
                        reject(err);
                    }
                    console.log(`Retrieved ${records.length} run log records.`);
                    resolve(records);
                });
        });

    }

    // THIS DOESN'T WORK
    // Updates Data_Object__mdt custom metadata objects
    async updateObjects(objects) {

        let conn = await this.authenticateSalesforce();

        return new Promise ((resolve, reject) => {
            // objects example:
            // [
            //     { Id : '0017000000hOMChAAO', Name : 'Updated Account #1' },
            //     { Id : '0017000000iKOZTAA4', Name : 'Updated Account #2' }
            // ]

            // Multiple records update
            conn.sobject(`${namespace}Data_Object__mdt`).update(objects,
                function(err, rets) {
                    if (err) {
                        console.error(`Error updating custom metadata ${namespace}Data_Object__mdt!`, err);
                        reject(err);
                    }
                    for (let i=0; i < rets.length; i++) {
                        if (rets[i].success) {
                            console.log("Updated Successfully : ", rets[i]);
                        } else {
                            console.warn("Update Failure : ", rets[i]);
                        }
                    }
                    resolve(rets);
                }
            );

        });
    }

    // This does NOT include custom metadata
    async describeAllMetadata() {
        const conn = await this.authenticateSalesforce();

        return new Promise ((resolve, reject) => {
            conn.metadata.describe(sfApiVersion, function(err, metadata) {
                if (err) {
                    console.error('err', err);
                    reject(err);
                }
                resolve(metadata);
            });
        });
    }

    // This reads the metadata definition itself, not the records
    async readMetadata(type, fullNames) {
        const conn = await this.authenticateSalesforce();

        // var fullNames = [ 'Account', 'Contact' ];
        return new Promise ((resolve, reject) => {
            conn.metadata.read(type, fullNames, function(err, metadata) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (metadata && metadata.length) {
                    for (let i=0; i < metadata.length; i++) {
                        var meta = metadata[i];
                        console.log("Full Name: " + meta.fullName);
                        console.log("Fields count: " + meta.fields.length);
                        console.log("Sharing Model: " + meta.sharingModel);
                    }
                }
                resolve(metadata);
            });
        });
    }

    // THIS DOESN'T WORK
    // Updates Data_Object__mdt custom metadata objects
    async updateObjectMetadata(objects) {
        const conn = await this.authenticateSalesforce();

        return new Promise ((resolve, reject) => {
            conn.metadata.update(`${namespace}Data_Object`, objects, function(err, results) {
                if (err) {
                    // console.error(`Error updating metadata: `, err);
                    reject(err);
                }
                if (results && results.length) {
                    for (let i=0; i < results.length; i++) {
                        const result = results[i];
                        console.log(`success: ${result.success}`);
                        console.log('fullName : ' + result.fullName);
                    }
                }
                resolve(results);
            });
        });
    }

}

module.exports = SalesforceModel;