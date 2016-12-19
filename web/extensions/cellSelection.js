define(['../override', 'jquery',], function(override, $) {
    'use strict';
    /**
     * Simple usage
     *  cellSelection: {
     *      onCellSelected: function(event, position) {
     *          // do something with position
     *      }
     *  }
     *
     */
    return function(grid, pluginOptions) {
        override(grid, function($super) {
            return {
                init: function init() {
                    $super.init.apply(this, arguments);

                    this.container.on('click', '.pg-cell', function(evt) {

                        var row = $(evt.currentTarget.parentNode).data('row-id');
                        var col = $(evt.currentTarget).data('column-key');

                        grid.selection.selectCell({row, col});
                    });

                    if (pluginOptions.onCellSelected) grid.on('onCellSelected', pluginOptions.onCellSelected);
                },

                selection: {
                    selectCell: function(position) {
                        grid.trigger('onCellSelected', position);
                    }
                }
            }
        });
    };
});
