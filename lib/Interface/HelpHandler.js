/*
 * This file is part of the Companion project
 * Copyright (c) 2018 Bitfocus AS
 * Authors: William Viker <william@bitfocus.io>, Håkon Nessjøen <haakon@bitfocus.io>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 *
 */

var debug = require('debug')('lib/Interface/HelpHandler')
var CoreBase = require('../Core/Base')
var fs = require('fs')

class InterfaceHelpHandler extends CoreBase {
	constructor(registry) {
		super(registry, 'help')

		this.system.on('http_req', this.processHttpRequest.bind(this))

		this.system.on('io_connect', (client) => {
			client.on('get_help_md', function (req, answer) {
				// Return the rendered HTML for the requested Markdown file.
				// req will look like { file:'file.md' }.

				// Pass the filename requested back to the response so the receiver can watch for
				//  their response in case two different requests were made at the same time.
				var resp = {
					error: true,
					file: req.file,
					markdown: '',
				}

				if (req.file !== undefined) {
					// Prevent directory traversal
					const markdownFilename = req.file.replace(/(\.\.|\/)/g, '')
					const path = require('app-root-path') + '/documentation/' + markdownFilename

					if (fs.existsSync(path)) {
						try {
							resp.markdown = fs.readFileSync(path).toString()
							resp.baseUrl = '/int/documentation/'
							resp.error = false
						} catch (e) {
							debug('Error loading help ' + path)
							debug(e)
						}
					}
				} else {
					debug('Invalid get_help request')
				}

				answer(resp)
			})
		})
	}

	processHttpRequest(req, res, done) {
		// Watch for HTTP requests made to /int/ (which emits 'http_req').
		var match

		// Return any asset made to /int/documentation/
		if ((match = req.url.match(/^\/documentation\/(.+?)(\?.+)?$/))) {
			var path = this.registry.getAppRoot() + '/documentation'
			var file = match[1].replace(/\.\.+/g, '')

			if (file.match(/\.(jpe?g|gif|png|pdf)$/) && fs.existsSync(path + '/' + file)) {
				if (done !== undefined && typeof done == 'function') {
					done()
				}

				res.sendFile(path + '/' + file)
			}
		} else if ((match = req.url.match(/^\/help\/([^/]+)\/(.+?)(\?.+)?$/))) {
			var path = this.registry.getAppRoot() + '/node_modules/companion-module-'
			var module = match[1].replace(/\.\.+/g, '')
			var file = match[2].replace(/\.\.+/g, '')

			if (file.match(/\.(jpe?g|gif|png|pdf)$/) && fs.existsSync(path + '/' + module + '/' + file)) {
				done()
				res.sendFile(path + '/' + module + '/' + file)
			}
		}
	}
}

exports = module.exports = InterfaceHelpHandler