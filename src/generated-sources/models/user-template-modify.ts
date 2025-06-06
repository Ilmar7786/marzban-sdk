/* tslint:disable */
/* eslint-disable */
/**
 * MarzbanAPI
 * Unified GUI Censorship Resistant Solution Powered by Xray
 *
 * The version of the OpenAPI document: 0.8.4
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface UserTemplateModify
 */
export interface UserTemplateModify {
    /**
     * 
     * @type {string}
     * @memberof UserTemplateModify
     */
    'name'?: string | null;
    /**
     * 
     * @type {number}
     * @memberof UserTemplateModify
     */
    'data_limit'?: number | null;
    /**
     * 
     * @type {number}
     * @memberof UserTemplateModify
     */
    'expire_duration'?: number | null;
    /**
     * 
     * @type {string}
     * @memberof UserTemplateModify
     */
    'username_prefix'?: string | null;
    /**
     * 
     * @type {string}
     * @memberof UserTemplateModify
     */
    'username_suffix'?: string | null;
    /**
     * 
     * @type {{ [key: string]: Array<string>; }}
     * @memberof UserTemplateModify
     */
    'inbounds'?: { [key: string]: Array<string>; };
}

