define(['override', 'jquery'], function(override, $) {
    //TODO port enable/disable of buttons logic.
    //TODO Do we still need special handling for group action buttons?
    //TODO visibility formula??

    "use strict";

    return {
        loadFirst: ['directinput'],
        init: function(grid, pluginOptions) {
            function createActionButtonsHtml (actions, clazz, datastore, col, record) {
                var allowDynamics = true;
                if(typeof col === 'boolean') {
                    allowDynamics = col;
                    col = undefined;
                }

                var buttonTemplate = document.createElement('button'),
                    iconTemplate = document.createElement('i'),
                    labelTemplate = document.createElement('span');

                return actions.reduce(function(fragment, action) {
                    var name = action.eventName;

                    var b = buttonTemplate.cloneNode();
                    b.setAttribute('name', name);
                    b.setAttribute('event', action.eventName);
                    b.classList.add(clazz);
                    if(col) {
                        b.setAttribute('data-columnkey', col.key);
                    }
                    if(action.cssClass) {
                        action.cssClass.split(' ').forEach(function(cl) {
                            b.classList.add(cl);
                        });
                    }
                    if(action.icon) {
                        var icon = iconTemplate.cloneNode();
                        icon.classList.add(action.icon);
                        b.appendChild(icon);
                    }
                    if(action.label) {
                        var label = labelTemplate.cloneNode();
                        label.textContent = action.label;
                        b.appendChild( label );
                    }
                    if(action.tooltip) {
                        b.setAttribute('title', action.tooltip);
                    }

                    if(action.tooltipFormula) {
                        var tooltip = datastore.getGlobalAttribute(record.id, action.eventName, 'actionTooltipFormula');
                        b.setAttribute('title', tooltip);
                    }

                    if(grid.options.key) {
                        b.setAttribute('layoutkey', grid.options.key);
                    }
                    if(action.hidden) {
                        b.setAttribute('data-hidden', action.hidden);
                        var hidden = pluginOptions.datastore.getGlobalAttribute(record.id, action.eventName, 'actionHidden');
                        if(hidden) {
                            b.style.display='none';
                        }
                    }
                    if(allowDynamics) {
                        b.setAttribute('data-disable-on-readonly', (action.disableOnReadOnly) ? action.disableOnReadOnly : false);
                    }

                    if((action.disableOnReadOnly || action.disabled) && allowDynamics) {
                        if(datastore.getGlobalAttribute(record.id, action.eventName, 'actionDisabled')) {
                            b.setAttribute('disabled', 'disabled');
                        }
                    }

                    if (action.cssClassFormula && allowDynamics) {
                        b.setAttribute('data-cssClassFormula', action.cssClassFormula);
                        b.classList.add(datastore.getGlobalAttribute(record.id, action.eventName, 'actionCssClassFormula'));
                    }

                    fragment.appendChild(b);
                    return fragment;
                }, document.createDocumentFragment());
            }

            override(grid, function($super) {
                return {
                    renderCellContent: function renderCellContent(record, column, value) {
                        var self = this;
                        var isActionCol = column.type == 'ACTION';
                        var hasActions = column.actions != null && column.actions.length > 0;
                        if(!isActionCol && !hasActions) {
                            return $super.renderCellContent(record, column, value);;
                        }
                        var cellContent;
                        if (hasActions) {
                            cellContent = this.actionbuttons.renderActionButtons(record, column);
                        }
                        if (column.template != null && column.template.indexOf('{{:button}}') > -1) {
                            return $super.renderCellContent($.extend({}, record, {button: cellContent[0].outerHTML}), column, value);
                        } else {
                            var frag = document.createDocumentFragment();
                            frag.appendChild(cellContent);
                            frag.appendChild($super.renderCellContent(record, column, value));
                            return frag;
                        }
                    },

                    init: function() {
                        var grid = this;
                        $super.init();

                        grid.options.columns.forEach(function(column) {
                            var hasActions = column.actions != null && column.actions.length > 0;
                            if (hasActions) {
                                column.actions.forEach(function(action) {
                                    if (action.hidden) {
                                        pluginOptions.datastore.registerGlobalAttribute(action.eventName , 'actionHidden', action.hidden);
                                    }
                                    if (action.disabled || action.disableOnReadOnly) {
                                        var f;
                                        if(action.disabled && action.disableOnReadOnly) {
                                            f = '$' + column.key + '.readOnly || (' + action.disabled + ')';
                                        } else if(action.disabled) {
                                            f = action.disabled;
                                        } else if(action.disableOnReadOnly) {
                                            f = '$' + column.key + '.readOnly';
                                        }
                                        pluginOptions.datastore.registerGlobalAttribute(action.eventName , 'actionDisabled', f);
                                    }
                                    if (action.cssClassFormula) {
                                        pluginOptions.datastore.registerGlobalAttribute(action.eventName , 'actionCssClassFormula', action.cssClassFormula);
                                    }
                                    if (action.tooltipFormula) {
                                        pluginOptions.datastore.registerGlobalAttribute(action.eventName , 'actionTooltipFormula', action.tooltipFormula);
                                    }
                                });
                            }
                        });

                        grid.target.off('click.actionbuttons');
                        grid.on('beforeedit', function(event) {
                            var hasActions = event.column.actions != null && event.column.actions.length > 0;
                            if (hasActions) {
                                event.preventDefault();
                            }
                        });
                        grid.target.on('click.actionbuttons', 'button.gridActionButton', function() {
                            var row = $(this).parents('.pg-row').first().attr('data-row-id');
                            var rowData = {};
                            rowData[row] = grid.dataSource.getRecordById(row);

                            grid.target.trigger({
                                type: $(this).attr('event'),
                                button: this,
                                row: {
                                    type: 'single',
                                    id: row,
                                    layout: $(this).attr('layoutkey'),
                                    rowData: rowData,
                                    childId: grid.options.childId
                                }
                            });
                            return false;
                        });

                        $(pluginOptions.datastore).on('valueschanged', function(e, list) {
                            var cells = this.resolveReverseDependencies(list);
                            var actions = cells.filter(function(e) { return e.attribute == 'actionHidden'; }).forEach(function(e) {
                                var b = grid.container.find('[data-row-id="' + e.row + '"] button.gridActionButton[event="' + e.property + '"]');
                                var hidden = pluginOptions.datastore.getGlobalAttribute(e.row, e.property, 'actionHidden');
                                b.toggle(!hidden);
                            });
                        });
                    },

                    actionbuttons: {
                        actionButtonCellContentTemplate: (function() {
                            var el = document.createElement('div');
                            el.className='btn-group';
                            return el;
                        })(),

                        renderActionButtons: function(record, column) {
                            var cellContent = this.actionButtonCellContentTemplate.cloneNode();

                            if(!column) {
                                column = grid.options.columns.filter(function(c) { return c.type == 'action'; })[0];
                                if(!column) return;
                            }

                            var actions = column.actions.filter(function(action) {
                                    var correctModel = action.model == null || action.model === record.model;
                                    return correctModel;
                                }
                            );

                            if (actions && actions.length) {
                                cellContent.appendChild(createActionButtonsHtml(actions, 'gridActionButton', pluginOptions.datastore, column, record));
                            }

                            return cellContent;
                        }
                    }
                };
            });
        }
    };

});
