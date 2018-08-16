define(['../override', 'jquery', '../utils'], function(override, $) {
    return {
        loadFirst: ['directinput'],
        init: function(grid, pluginOptions) {
            override(grid, function($super) {
                return {
                    renderCell: function(record, column, rowIndex, columnIndex) {
                        let cell = $super.renderCell.apply(this, arguments);

                        let editable = this.editing.isEditable(record, column);
                        if(editable) {
                            cell.classList.add('pg-editable');
                        }
                        return cell;
                    },

                    renderCellContent: function renderCellContent(record, column, value) {
                        let cellContent;
                        let isProgressBarCol = column.type === 'PROGRESS_BAR';
                        if(!isProgressBarCol) {
                            return $super.renderCellContent(record, column, value);
                        }
                        else {
                            cellContent = this.progressBar.renderProgressBar(record, column, value);
                        }

                        let fragment = document.createDocumentFragment();
                        fragment.appendChild(cellContent);
                        fragment.appendChild($super.renderCellContent(record, column, value));
                        return fragment;
                    },

                    progressBar: {
                        progressBarCellContentTemplate: (function() {
                            let cell = document.createElement('div');
                            return cell;
                        })(),

                        //TODO need to do through value instead of record[6], value is undefined at this moment
                        renderProgressBar: function(record, column, value) {
                            let cellContent = this.progressBarCellContentTemplate.cloneNode();

                            if (record[6] === undefined) {
                                return cellContent;
                            }

                            let progress = document.createElement('div');
                            progress.setAttribute('class', 'pg-progress');

                            let progressBar = document.createElement('div');
                            progressBar.setAttribute('class', 'pg-progress-bar');
                            progressBar.setAttribute('style', 'width: ' + record[6] + '%');
                            progressBar.textContent = record[6] + ' %';

                            progress.appendChild(progressBar);
                            cellContent.appendChild(progress);

                            if(!column) {
                                column = grid.options.columns.filter(function(c) { return c.type == 'progress_bar'; })[0];
                                if(!column) return;
                            }
                            return cellContent;
                        },
                    },

                    editing: {
                        isEditable: function(record, column) {
                            let editable = column.editable;
                            if(editable && typeof pluginOptions.isEditable === 'function') {
                                editable = pluginOptions.isEditable.apply(grid, [record, column]);
                            }
                            return editable;
                        }
                    }
                };
            });
        }
    };
});
