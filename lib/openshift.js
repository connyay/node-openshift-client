/*
 * node-openshift-client
 * https://github.com/shekhargulati/node-openshift-client
 *
 * Copyright (c) 2013 Shekhar Gulati
 * Licensed under the MIT license.
 */

'use strict';
var Q = require('q');
var request = require('request').defaults({
	encoding: 'utf-8'
});

var BASE_URL,
	STRICT_SSL = true;

function OpenShift(options) {
	var host = (options.host) ? options.host : 'openshift.redhat.com';
	BASE_URL = 'https://' + host + '/broker/rest/';
	this.options = options;
	if (options.username && options.password) {
		this.authorization = 'Basic ' + new Buffer(options.username + ':' + options.password).toString('base64');
	} else if (options.token) {
		this.authorization = 'Bearer ' + options.token;
	} else {
		console.error('No authorization provided.');
	}

	if (options.strictSSL === false) {
		STRICT_SSL = false;
	}
}

function options(authorization, rest_url_fragment, data, method) {
	var optionsObj = {
		method: method || 'GET',
		url: BASE_URL + rest_url_fragment,
		headers: {
			'Accept': 'application/json',
			'Authorization': authorization
		},
		strictSSL: STRICT_SSL,
		form: data
	};
	return optionsObj;
}

OpenShift.prototype.authorizationToken = function() {
	return this._request('user/authorizations', {
		scope: 'session'
	}, 'POST');
};

OpenShift.prototype.showUser = function() {
	return this._request('user');
};

OpenShift.prototype.listDomains = function() {
	return this._request('domains');
};

OpenShift.prototype.createDomain = function(domain_name) {
	return this._request('domains', {
		id: domain_name
	}, 'POST');
};

OpenShift.prototype.viewDomainDetails = function(domain_name) {
	return this._request('domains/' + domain_name);
};

OpenShift.prototype.updateDomain = function(old_domain_name, new_domain_name) {
	return this._request('domains/' + old_domain_name, {
		id: new_domain_name
	}, 'PUT');
};

OpenShift.prototype.deleteDomain = function(domain_name) {
	var force = true;
	return this._request('domains/' + domain_name, {
		force: force
	}, 'DELETE');
};

OpenShift.prototype.listApplications = function(domain_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications';
	return this._request(rest_url_fragment);
};

OpenShift.prototype.listApplicationsAndCartridges = function(domain_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications?include=cartridges';
	return this._request(rest_url_fragment);
};

OpenShift.prototype.createApplication = function(domain_name, app_options) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications';
	return this._request(rest_url_fragment, app_options, 'POST');
};

OpenShift.prototype.viewApplicationDetails = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name;
	return this._request(rest_url_fragment);
};

OpenShift.prototype.startApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'start'
	}, 'POST');
};

OpenShift.prototype.stopApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'stop'
	}, 'POST');
};

OpenShift.prototype.forceStopApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'force-stop'
	}, 'POST');
};

OpenShift.prototype.restartApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'restart'
	}, 'POST');
};

OpenShift.prototype.deleteApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name;
	return this._request(rest_url_fragment, null, 'DELETE');
};

OpenShift.prototype.scaleUpApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'scale-up'
	}, 'POST');
};

OpenShift.prototype.scaleDownApplication = function(domain_name, app_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/events';
	return this._request(rest_url_fragment, {
		event: 'scale-down'
	}, 'POST');
};

OpenShift.prototype.listCartridges = function() {
	return this._request('cartridges');
};

OpenShift.prototype.addCartridge = function(domain_name, app_name, cartridge_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/cartridges';
	return this._request(rest_url_fragment, {
		cartridge: cartridge_name
	}, 'POST');
};

OpenShift.prototype.viewCartridgeDetails = function(domain_name, app_name, cartridge_name) {
	var rest_url_fragment = 'domains/' + domain_name + '/applications/' + app_name + '/cartridges/' + cartridge_name;
	return this._request(rest_url_fragment);
};

OpenShift.prototype.setAuthorization = function(auth) {
	this.authorization = auth;
};

OpenShift.prototype._request = function(url, data, method) {
	var deferred = Q.defer(),
		requestArgs = options(this.authorization, url, data, method);
	request(requestArgs, function(err, res, body) {
		if (err) {
			return deferred.reject(err);
		}
		if (res.statusCode < 200 || res.statusCode > 299) {
			return deferred.reject(body, new Error((body && body.error) || 'HTTP ' + res.statusCode));
		}
		deferred.resolve(body);
	});
	return deferred.promise;
};

module.exports = OpenShift;
