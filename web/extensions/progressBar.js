define(['../override', 'jquery', '../utils'], function(override, $, utils) {
    return {
        loadFirst: ['directinput'],
        init: function(grid) {
            override(grid, function($super) {
                return {
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
                    }
                };
            });
        }
    };
});
