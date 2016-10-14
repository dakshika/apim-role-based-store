/*
 Description: Initialization script
 Filename:app.js
 Created Date: 10/06/2016
 Author: Dakshika Jayathilak (dakshika@wso2.com)
 */

var carbon = require('carbon');
var tenantId = -1234;
var log = new Log();
var permissionPaths = require('/site/conf/ui-permissions.json');

function getPermissionNameFromPath(path) {
        var components = path.split('/');
        return components[components.length - 1];
}

function addPermissionCollection(path, registry) {
        var resource = {};
        var name = getPermissionNameFromPath(path);
        var collection = registry.registry.newCollection();
        collection.setProperty('name', name);
        registry.registry.put(path, collection);
}

function recursivelyCreatePath(path, registry) {
        path = path.substring(1);
        var components = path.split('/');
        recursivelyCreateCollections(0, components, registry);
}

function recursivelyCreateCollections(current, elements, registry) {
        if (current > elements.length - 1) {
            return;
        } else {
            var path = '';
            for (var index = 0; index <= current; index++) {
                path += '/' + elements[index];
            }
            //Check if the path exists
            if (!registry.exists(path)) {
                //Create the collection
                addPermissionCollection(path, registry);
            }
            current++;
            recursivelyCreateCollections(current, elements, registry);
        }
}

function createSystemRegistry(tenantId) {
        var options = {};
        options.server = {};
        options.server.https = 'https://localhost:9443';
        var srv = new carbon.server.Server({
            url: options.server.https
        });
        return new carbon.registry.Registry(srv, {
            system: true,
            tenantId: tenantId
        });
}

function addPermission(permissionString, tenantId) {
        var systemRegistry = createSystemRegistry(tenantId);
        if(permissionString.charAt(0)!== '/') {
            permissionString = '/' + permissionString;
        }
        var fullPermissionPath = '/_system/governance/permission/admin' + permissionString;

        if (!systemRegistry.exists(fullPermissionPath)) {
            if (log.isDebugEnabled()) {
                log.debug('Recursively creating path in ' + fullPermissionPath);
            }
            recursivelyCreatePath(fullPermissionPath, systemRegistry);
            return true;
        }

        return false;
}

Object.keys(permissionPaths).map(
    function (key) {
        return addPermission('/ui'+permissionPaths[key], tenantId);
    }
);