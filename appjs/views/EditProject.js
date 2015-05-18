"use strict";

var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    models = require('../models'),
    FormView = require('./FormView');

module.exports = FormView.extend({
  template: require('../templates/project_form.ejs'),

  afterInit: function() {
    this.setupBlueprint();
  },

  afterRender: function() {
    if ( _.isUndefined( this.model.blueprint ) ) {
      this.setupBlueprint();
    }

    if( ! this.model.blueprint.has('config') ) {
      this.app.view.spinStart();
      this.model.blueprint.fetch();
    } else {
      this.renderForm();
    }
  },

  setupBlueprint: function() {
    if ( _.isUndefined(this.model.blueprint) && this.model.has('blueprint_id') ) {
      this.model.blueprint = new models.Blueprint({ id: this.model.get('blueprint_id') });
    }

    if ( _.isObject( this.model.blueprint ) ) {
      this.listenTo(this.model.blueprint, 'sync', this.render);
      this.listenTo(this.model.blueprint, 'error', this.handleSyncError);
    }
  },

  renderForm: function() {
    var $form = this.$el.find('#projectForm'),
        form_config;

    if ( this.model.isNew() ) {
     form_config = this.model.blueprint.get('config').form;
    } else {
     form_config = this.model.get('blueprint_config').form;
    }

    if(_.isUndefined(form_config)) {
      this.error('This blueprint does not have a form!');
    } else {
      var schema_properties = {
            "title": {
              "title": "Title",
              "description": "hello world?",
              "type": "string",
              "required": true
            },
            "slug": {
              "title": "Slug",
              "description": "hello world?",
              "type": "string"
            }
          },
          options_form = {
            "attributes": {
              "data-model": "Project",
              "data-model-id": this.model.isNew() ? '' : this.model.id,
              "data-action": this.model.isNew() ? 'new' : 'edit',
              "data-next": "show"
            },
            "buttons": { "submit": { "value": "Save" } }
          },
          options_fields = {};

      _.extend(schema_properties, form_config['schema']['properties'] || {});
      if(form_config['options']) {
        _.extend(options_form, form_config['options']['form'] || {});
        _.extend(options_fields, form_config['options']['fields'] || {});
      }

      var opts = {
        "schema": {
          "title": this.model.blueprint.get('title'),
          "description": this.model.blueprint.get('config').description,
          "type": "object",
          "properties": schema_properties
        },
        "options": {
          "form": options_form,
          "fields": options_fields
        },
        "postRender": function(control) {
          control.form.getButtonEl("submit").data('loading-text', 'Saving...');
        }
      };
      if(!this.model.isNew()) {
        opts.data = {
          'title': this.model.get('title'),
          'slug': this.model.get('slug')
        };
        _.extend(opts.data, this.model.get('data'));
      }
      $form.alpaca(opts);
    }
  },

  formValues: function($form) {
    var data = $form.alpaca('get').getValue();
    return {
      title: data['title'],
      slug:  data['slug'],
      theme: data['theme'],
      data:  data,
      blueprint_id: this.model.blueprint.get('id')
    };
  }
});
