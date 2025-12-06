document.addEventListener('DOMContentLoaded', function() {
            const scheduleForm = document.getElementById('schedule-form');
            const resetBtn = document.getElementById('resetBtn');
            const scheduleTable = document.getElementById('scheduleTable');
            const classTypeSelect = document.getElementById('classType');
            
            const STORAGE_KEY = 'iu7-32b-schedule';
            
            const initialSchedule = [
                ['', '', 'Английский', '', '', ''],
                ['ВУЦ', '', 'Программирование', 'Дискретная математика', 'Основы электроники', ''],
                ['ВУЦ', 'Физ-ра', 'ТиСДан', 'Дискретная математика', 'Основы электроники', 'ТиСДан'],
                ['ВУЦ', 'Правоведение', 'Физ-ра', '', 'Основы электроники', 'Программирование'],
                ['ВУЦ', 'Физика', '', '', 'Дискретная математика', 'Программирование'],
                ['ВУЦ', '', '', '', '', '']
            ];
            
            const initialTypes = [
                [null, null, 'seminar', null, null, null],
                [null, null, 'lab', 'lecture', 'lab', null],
                [null, null, 'lecture', 'lecture', 'lecture', 'lecture'], 
                [null, 'lecture', null, null, 'lecture', 'seminar'],
                [null, 'lecture', null, 'lecture', 'lab', null],
                [null, null, null, null, 'lab', null]
            ];
            
            const initialMerges = [
                { row: 1, col: 0, rowspan: 5 },
                { row: 1, col: 3, rowspan: 2 }, 
                { row: 2, col: 4, rowspan: 2 }, 
                { row: 3, col: 5, rowspan: 2 }  
            ];
            
            const noTypeSubjects = ['Физ-ра', 'ВУЦ'];
            
            let schedule = JSON.parse(JSON.stringify(initialSchedule));
            let types = JSON.parse(JSON.stringify(initialTypes));
            let merges = JSON.parse(JSON.stringify(initialMerges));
            let selectedCell = null;
            
            function clearSelection() {
                const allCells = scheduleTable.querySelectorAll('.class-cell');
                allCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
                selectedCell = null;
            }
            
            function selectCell(cell) {
                clearSelection();
                cell.classList.add('selected');
                selectedCell = cell;
            }
            
            function needsType(subjectName) {
                return !noTypeSubjects.includes(subjectName);
            }
            
            function loadSchedule() {
                const savedData = localStorage.getItem(STORAGE_KEY);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    schedule = data.schedule;
                    types = data.types;
                    merges = data.merges;
                }
                renderTable();
            }
            
            function saveSchedule() {
                const data = {
                    schedule: schedule,
                    types: types,
                    merges: merges
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
            
            function renderTable() {
                while (scheduleTable.rows.length > 1) {
                    scheduleTable.deleteRow(1);
                }
                
                const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
                const pairs = ['1 пара', '2 пара', '3 пара', '4 пара', '5 пара', '6 пара'];
                
                for (let row = 0; row < 6; row++) {
                    const tr = scheduleTable.insertRow();
                    const tdPair = tr.insertCell();
                    tdPair.textContent = pairs[row];
                    
                    for (let col = 0; col < 6; col++) {
                        const td = tr.insertCell();
                        td.className = 'class-cell';
                        td.dataset.row = row;
                        td.dataset.col = col;
                        
                        const subject = schedule[row][col];
                        const type = types[row][col];
                        
                        if (subject) {
                            const subjectSpan = document.createElement('span');
                            subjectSpan.textContent = subject;
                            subjectSpan.style.display = 'block';
                            td.appendChild(subjectSpan);
                            
                            if (type && needsType(subject)) {
                                const typeSpan = document.createElement('span');
                                typeSpan.className = 'class-type';
                                typeSpan.textContent = getTypeName(type);
                                td.appendChild(typeSpan);
                            }
                            
                            if (subject === 'ВУЦ') {
                                td.classList.add('vuc');
                            }
                        }
                    }
                }
                
                applyMerges();
            }

            function applyMerges() {
                merges.forEach(merge => {
                    const startCell = scheduleTable.rows[merge.row + 1].cells[merge.col + 1];
                    if (startCell) {
                        startCell.rowSpan = merge.rowspan;
                        
                        for (let i = 1; i < merge.rowspan; i++) {
                            const hiddenCell = scheduleTable.rows[merge.row + i + 1].cells[merge.col + 1];
                            if (hiddenCell) {
                                hiddenCell.style.display = 'none';
                            }
                        }
                    }
                });
            }
            
            function getTypeName(type) {
                const typeNames = {
                    'lecture': 'Лекция',
                    'lab': 'Лабораторная работа', 
                    'seminar': 'Семинар'
                };
                return typeNames[type] || '';
            }
            
            function breakMerge(row, col) {
                const mergeIndex = merges.findIndex(m => 
                    col === m.col && row >= m.row && row < m.row + m.rowspan
                );
                
                if (mergeIndex !== -1) {
                    merges.splice(mergeIndex, 1);
                    return true;
                }
                return false;
            }
            
            scheduleForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const subjectName = document.getElementById('subjectName').value.trim();
                const classType = document.getElementById('classType').value;
                const selectedDay = document.querySelector('input[name="weekday"]:checked');
                const selectedPairs = document.querySelectorAll('input[name="classNumber"]:checked');
                
                if (!selectedDay || selectedPairs.length === 0) {
                    alert('Пожалуйста, выберите день недели и хотя бы одну пару');
                    return;
                }
                
                const day = parseInt(selectedDay.value);
                
                selectedPairs.forEach(pair => {
                    const row = parseInt(pair.value);
                    
                    breakMerge(row, day);
                    
                    schedule[row][day] = subjectName;
                    
                    if (subjectName && needsType(subjectName)) {
                        types[row][day] = classType;
                    } else {
                        types[row][day] = null;
                    }
                });
                
                saveSchedule();
                renderTable();
                scheduleForm.reset();
                clearSelection();
            });
            
            resetBtn.addEventListener('click', function() {
                if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
                    localStorage.removeItem(STORAGE_KEY);
                    schedule = JSON.parse(JSON.stringify(initialSchedule));
                    types = JSON.parse(JSON.stringify(initialTypes));
                    merges = JSON.parse(JSON.stringify(initialMerges));
                    renderTable();
                    clearSelection();
                }
            });
            
            scheduleTable.addEventListener('click', function(e) {
                const cell = e.target.closest('.class-cell');
                if (!cell) return;
                
                let row = parseInt(cell.dataset.row);
                let col = parseInt(cell.dataset.col);
                
                if (cell.style.display === 'none') {
                    for (const merge of merges) {
                        if (col === merge.col && row >= merge.row && row < merge.row + merge.rowspan) {
                            row = merge.row;
                            break;
                        }
                    }

                    const visibleCell = scheduleTable.rows[row + 1].cells[col + 1];
                    selectCell(visibleCell);
                } else {
                    selectCell(cell);
                }
                
                const subjectName = schedule[row][col] || '';
                
                document.getElementById('subjectName').value = subjectName;
                document.querySelector(`[name="weekday"][value="${col}"]`).checked = true;
                
                document.querySelectorAll('[name="classNumber"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                document.querySelector(`[name="classNumber"][value="${row}"]`).checked = true;
                
                if (needsType(subjectName)) {
                    classTypeSelect.value = types[row][col] || 'lecture';
                } else {
                    classTypeSelect.value = 'lecture'; 
                }
            });
            
            loadSchedule();
});