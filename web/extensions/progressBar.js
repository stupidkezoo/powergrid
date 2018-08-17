define(['../override', 'jquery', '../utils'], function(override, $, utils) {
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

                    renderCellContent: function(record, column, value) {
                        const isProgressBarCol = column.type === 'PROGRESS_BAR';
                        if(!isProgressBarCol) {
                            return $super.renderCellContent(record, column, value);
                        }
                        const cellContent = this.progressBar.renderProgressBar(record, column, value);
                        const fragment = document.createDocumentFragment();
                        fragment.appendChild(cellContent);
                        fragment.appendChild($super.renderCellContent(record, column, value));
                        return fragment;
                    },

                    progressBar: {
                        renderProgressBar: function(record, column) {
                            let cellContent = document.createElement('div');
                            let value = utils.getValue(record, column.key);

                            if (value === undefined) {
                                return cellContent;
                            }

                            let progress = document.createElement('div');
                            progress.setAttribute('class', 'pg-progress');

                            let progressBar = document.createElement('div');
                            progressBar.setAttribute('class', 'pg-progress-bar');
                            progressBar.setAttribute('style', 'width: ' + value + '%');
                            progressBar.textContent = value + ' %';

                            progress.appendChild(progressBar);
                            cellContent.appendChild(progress);

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
