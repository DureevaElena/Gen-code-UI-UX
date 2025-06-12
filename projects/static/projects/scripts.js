// Глобальные переменные
let elements = []; // Массив для хранения всех элементов, включая article
let customHtmlCss = ''; // Пользовательский CSS-код
let currentElementType = ''; // Тип текущего редактируемого элемента
let contextMenuVisible = false; // Флаг видимости контекстного меню
let contextMenuElementIndex = -1; // Индекс элемента для контекстного меню
let contextMenuArticleId = null; // ID article для контекстного меню
let isEditing = false; // Флаг режима редактирования
let editingIndex = -1; // Индекс редактируемого элемента
let editingArticleId = null; // ID article, если редактируется элемент внутри article
let resizingElementIndex = -1; // Индекс элемента для изменения размера
let isResizing = false; // Флаг режима изменения размера
let isHorizontal = false; // Флаг горизонтального расположения
let articleCounter = 0; // Счётчик для создания уникальных ID для article

// Конфигурация элементов
const elementConfig = {
    input: {
        html: (element, id) => `<input type="text" placeholder="${element.placeholder || 'Поле ввода'}" id="${id}" aria-label="${element.placeholder || 'Поле ввода'}">`,
        defaultCss: (element) => `padding: 10px; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; border: 1px solid #ccc; border-radius: 4px;`,
        createDom: (element, idx) => {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = element.placeholder || 'Поле ввода';
            input.id = `input${idx}`;
            input.setAttribute('aria-label', element.placeholder || 'Поле ввода');
            if (element.customStyles) input.style.cssText = element.customStyles;
            return input;
        }
    },
    button: {
        html: (element, id) => `<button id="${id}" aria-label="${element.text || 'Кнопка'}">${element.text || 'Нажми меня'}</button>`,
        defaultCss: (element) => `padding: 10px 20px; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; background-color: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer;`,
        hoverCss: (id) => `#${id}:hover { background-color: #0056b3; }`,
        createDom: (element, idx) => {
            const button = document.createElement('button');
            button.textContent = element.text || 'Нажми меня';
            button.id = `button${idx}`;
            button.setAttribute('aria-label', element.text || 'Кнопка');
            if (element.customStyles) button.style.cssText = element.customStyles;
            return button;
        }
    },
    line: {
        html: (element, id) => `<hr id="${id}" role="separator" aria-label="Горизонтальная линия">`,
        defaultCss: (element) => `border: none; border-top: 2px solid #000000; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; height: 0; width: ${element.length || 100}px;`,
        createDom: (element, idx) => {
            const hr = document.createElement('hr');
            hr.id = `line${idx}`;
            hr.setAttribute('role', 'separator');
            hr.setAttribute('aria-label', 'Горизонтальная линия');
            if (element.customStyles) hr.style.cssText = element.customStyles;
            const div = document.createElement('div');
            const resizeHandleLeft = document.createElement('span');
            resizeHandleLeft.className = 'resize-handle resize-left';
            resizeHandleLeft.dataset.indexId = idx;
            resizeHandleLeft.onclick = (e) => startResize(e, idx, 'left');
            const resizeHandleRight = document.createElement('span');
            resizeHandleRight.className = 'resize-handle resize-right';
            resizeHandleRight.dataset.indexId = idx;
            resizeHandleRight.onclick = (e) => startResize(e, idx, 'right');
            div.appendChild(resizeHandleLeft);
            div.appendChild(hr);
            div.appendChild(resizeHandleRight);
            return div;
        }
    },
    heading: {
        html: (element, id) => `<h1 id="${id}" aria-label="${element.text || 'Заголовок'}">${element.text || 'Заголовок'}</h1>`,
        defaultCss: (element) => `margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; font-size: 24px; font-weight: bold;`,
        createDom: (element, idx) => {
            const heading = document.createElement('h1');
            heading.textContent = element.text || 'Заголовок';
            heading.id = `heading${idx}`;
            heading.setAttribute('aria-label', element.text || 'Заголовок');
            if (element.customStyles) heading.style.cssText = element.customStyles;
            return heading;
        }
    },
    rectangle: {
        html: (element, id) => `<div id="${id}" role="img" aria-label="Прямоугольник"></div>`,
        defaultCss: (element) => `width: ${element.width || 100}px; height: ${element.height || 50}px; background-color: #cccccc; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'};`,
        createDom: (element, idx) => {
            const shape = document.createElement('div');
            shape.id = `rectangle${idx}`;
            shape.setAttribute('role', 'img');
            shape.setAttribute('aria-label', 'Прямоугольник');
            if (element.customStyles) shape.style.cssText = element.customStyles;
            return shape;
        }
    },
    image: {
        html: (element, id) => `<img src="${element.file_path || 'https://via.placeholder.com/100x50'}" id="${id}" alt="Изображение" aria-label="Изображение">`,
        defaultCss: (element) => `width: ${element.width || 100}px; height: ${element.height || 50}px; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; object-fit: contain;`,
        createDom: (element, idx) => {
            const img = document.createElement('img');
            img.src = element.file_path || 'https://via.placeholder.com/100x50';
            img.id = `image${idx}`;
            img.setAttribute('alt', 'Изображение');
            img.setAttribute('aria-label', 'Изображение');
            if (element.customStyles) img.style.cssText = element.customStyles;
            return img;
        }
    },
    article: {
        html: (element, id) => {
            let html = `<article id="${id}">`;
            element.children.forEach((child, childIdx) => {
                const childId = `${id}-child${childIdx}`;
                const childConfig = elementConfig[child.type];
                if (childConfig) {
                    html += `    ${childConfig.html(child, childId)}`;
                }
            });
            html += `</article>`;
            return html;
        },
        defaultCss: (element) => `background-color: white; padding: 10px; border: 1px solid #ccc; margin: ${isHorizontal ? '0 10px 0 0' : '5px 0'}; display: flex; flex-direction: ${isHorizontal ? 'row' : 'column'}; flex-wrap: wrap;`,
        createDom: (element, idx) => {
            const article = document.createElement('div');
            article.id = `article${idx}`;
            article.className = 'article-container';
            if (element.customStyles) article.style.cssText = element.customStyles;
            element.children.forEach((child, childIdx) => {
                const childDiv = createElementDiv(child, `child${childIdx}`, element.id);
                article.appendChild(childDiv);
            });
            return article;
        }
    }
};

// Получение CSRF-токена из cookies
function getCookies(name) {
    console.log('Получение cookies:', name);
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Загрузка изображения на сервер
async function uploadImage(file) {
    console.log('Загрузка изображения');
    const formData = new FormData();
    formData.append('image', file);
    try {
        const response = await fetch('/projects/upload_image/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookies('csrftoken') },
            body: formData
        });
        const result = await response.json();
        if (result.status === 'success') {
            console.log('Изображение загружено:', result.file_path);
            return result.file_path;
        } else {
            console.error('Ошибка загрузки:', result.error);
            alert('Ошибка: ' + result.error);
            return null;
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки: ' + error);
        return null;
    }
}

// Переключение ориентации элементов
function toggleOrientation() {
    console.log('Переключение ориентации');
    isHorizontal = !isHorizontal;
    updatePreview();
}

// Изменение размера формы
function changeFormSize() {
    console.log('Изменение размера формы');
    const select = document.getElementById('form-size');
    const [width] = select.value.split('x').map(Number);
    const preview = document.getElementById('form-preview');
    preview.style.width = `${width}px`;
    updatePreview();
}

// Открытие модального окна редактора стилей
function showStyleEditor(type, index = -1, articleId = null) {
    console.log('Открытие редактора стилей:', type, index, articleId);
    currentElementType = type;
    const modal = document.getElementById('style-editor-modal');
    const title = document.getElementById('style-editor-title');
    const submitButton = document.getElementById('style-editor-submit');
    const textInput = document.getElementById('element-text');
    const textLabel = document.getElementById('element-text-label');
    const textContainer = document.getElementById('element-text-container');
    const fileInput = document.getElementById('element-file');
    const fileContainer = document.getElementById('element-file-container');
    const widthContainer = document.getElementById('style-width-container');
    const heightContainer = document.getElementById('style-height-container');

    textContainer.style.display = type === 'article' ? 'none' : 'block';
    fileContainer.style.display = type === 'image' ? 'block' : 'none';
    widthContainer.style.display = type === 'article' ? 'none' : 'block';
    heightContainer.style.display = type === 'article' ? 'none' : 'block';

    if (type === 'line') {
        textLabel.textContent = 'Длина (px):';
        textInput.type = 'number';
        textInput.placeholder = 'e.g., 100';
    } else if (type === 'heading') {
        textLabel.textContent = 'Текст заголовка:';
        textInput.type = 'text';
        textInput.placeholder = 'e.g., Заголовок';
    } else if (type === 'rectangle' || type === 'image') {
        textLabel.textContent = 'Ширина (px):';
        textInput.type = 'number';
        textInput.placeholder = 'e.g., 100';
    } else if (type === 'input') {
        textLabel.textContent = 'Placeholder:';
        textInput.type = 'text';
        textInput.placeholder = 'Введите текст...';
    } else if (type === 'button') {
        textLabel.textContent = 'Текст кнопки:';
        textInput.type = 'text';
        textInput.placeholder = 'Нажми меня';
    }

    if (index >= 0) {
        isEditing = true;
        editingIndex = index;
        editingArticleId = articleId;
        let element;
        if (articleId) {
            element = elements.find(e => e.id === articleId).children[index];
        } else {
            element = elements[index];
        }
        title.textContent = 'Редактировать элемент';
        submitButton.textContent = 'Сохранить';

        textInput.value = element.placeholder || element.text || element.length || element.width || '';
        fileInput.value = '';

        const styles = element.customStyles ? element.customStyles.split(';').map(s => s.trim()).filter(s => s) : [];
        const styleMap = {};
        styles.forEach(style => {
            const [key, value] = style.split(':').map(s => s.trim());
            styleMap[key] = value;
        });

        document.getElementById('style-bg-color').value = styleMap['background-color'] || (type === 'line' ? '#000000' : type === 'article' ? '#ffffff' : '#cccccc');
        document.getElementById('style-text-color').value = styleMap['color'] || '#000000';
        document.getElementById('style-font-size').value = styleMap['font-size'] ? parseInt(styleMap['font-size']) : '';
        document.getElementById('style-padding').value = styleMap['padding'] ? parseInt(styleMap['padding']) : '';
        document.getElementById('style-margin').value = styleMap['margin'] ? parseInt(styleMap['margin']) : '';
        document.getElementById('style-border-width').value = styleMap['border'] ? parseInt(styleMap['border']) : '';
        document.getElementById('style-border-color').value = styleMap['border'] ? (styleMap['border'].split(' ')[2] || '#000000') : '#000000';
        document.getElementById('style-border-radius').value = styleMap['border-radius'] ? parseInt(styleMap['border-radius']) : '';
        document.getElementById('style-width').value = styleMap['width'] ? parseInt(styleMap['width']) : (element.width || '');
        document.getElementById('style-height').value = styleMap['height'] ? parseInt(styleMap['height']) : (element.height || '');
        document.getElementById('style-rotate').value = styleMap['transform'] ? parseInt(styleMap['transform'].match(/rotate\((\d+)deg\)/)?.[1] || 0) : '';
    } else {
        isEditing = false;
        editingIndex = -1;
        editingArticleId = null;
        title.textContent = 'Добавить элемент';
        submitButton.textContent = 'Добавить';
        textInput.value = type === 'input' ? 'Введите текст...' : type === 'button' ? 'Нажми меня' : type === 'line' ? '100' : type === 'heading' ? 'Заголовок' : type === 'rectangle' ? '100' : type === 'image' ? '100' : '';
        fileInput.value = '';
        document.getElementById('style-bg-color').value = type === 'article' ? '#ffffff' : type === 'line' ? '#000000' : '#cccccc';
        document.getElementById('style-text-color').value = '#000000';
        document.getElementById('style-font-size').value = type === 'heading' ? '24' : '';
        document.getElementById('style-padding').value = type === 'article' ? '10' : '';
        document.getElementById('style-margin').value = '';
        document.getElementById('style-border-width').value = type === 'article' ? '1' : '';
        document.getElementById('style-border-color').value = type === 'article' ? '#cccccc' : '#000000';
        document.getElementById('style-border-radius').value = '';
        document.getElementById('style-width').value = type === 'rectangle' || type === 'image' ? '100' : '';
        document.getElementById('style-height').value = type === 'rectangle' || type === 'image' ? '50' : '';
        document.getElementById('style-rotate').value = '';
    }

    modal.style.display = 'flex';
    if (type !== 'article') textInput.focus();
}

// Закрытие модального окна
function cancelStyleEditor() {
    console.log('Закрытие редактора стилей');
    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
    editingArticleId = null;
}

// Сохранение или добавление элемента
async function submitStyleEditor() {
    console.log('Сохранение элемента, isEditing:', isEditing, 'editingIndex:', editingIndex, 'editingArticleId:', editingArticleId);
    const type = currentElementType;
    const text = document.getElementById('element-text').value || (type === 'input' ? 'Введите текст...' : type === 'button' ? 'Нажми меня' : type === 'line' ? '100' : type === 'heading' ? 'Заголовок' : type === 'rectangle' ? '100' : type === 'image' ? '100' : '');
    const section = document.getElementById('section-select').value;
    let element = { type, section };

    if (type === 'image') {
        const fileInput = document.getElementById('element-file');
        let filePath = isEditing && editingIndex >= 0 && editingArticleId ? elements.find(e => e.id === editingArticleId).children[editingIndex].file_path : isEditing && editingIndex >= 0 ? elements[editingIndex].file_path : null;
        if (fileInput.files.length > 0) {
            filePath = await uploadImage(fileInput.files[0]);
            if (!filePath) return;
        } else if (!isEditing) {
            alert('Выберите изображение.');
            return;
        }
        element.file_path = filePath;
        element.width = parseInt(text) || 100;
        element.height = parseInt(document.getElementById('style-height').value) || 50;
    } else if (type === 'input') {
        element.placeholder = text;
    } else if (type === 'button' || type === 'heading') {
        element.text = text;
    } else if (type === 'line') {
        element.length = parseInt(text) || 100;
    } else if (type === 'rectangle') {
        element.width = parseInt(text) || 100;
        element.height = parseInt(document.getElementById('style-height').value) || 50;
    } else if (type === 'article') {
        element.id = `article${articleCounter++}`;
        element.children = [];
    }

    const bgColor = document.getElementById('style-bg-color').value;
    const textColor = document.getElementById('style-text-color').value;
    const fontSize = document.getElementById('style-font-size').value;
    const padding = document.getElementById('style-padding').value;
    const margin = document.getElementById('style-margin').value;
    const borderWidth = document.getElementById('style-border-width').value;
    const borderColor = document.getElementById('style-border-color').value;
    const borderRadius = document.getElementById('style-border-radius').value;
    const width = document.getElementById('style-width').value;
    const height = document.getElementById('style-height').value;
    const rotate = document.getElementById('style-rotate').value;

    let styles = [];
    if (bgColor !== (type === 'line' ? '#000000' : type === 'article' ? '#ffffff' : '#cccccc')) styles.push(`background-color: ${bgColor}`);
    if (textColor !== '#000000' && type !== 'line' && type !== 'rectangle' && type !== 'image') styles.push(`color: ${textColor}`);
    if (fontSize && type !== 'line' && type !== 'rectangle' && type !== 'image') styles.push(`font-size: ${fontSize}px`);
    if (padding) styles.push(`padding: ${padding}px`);
    if (margin) styles.push(`margin: ${margin}px`);
    if (borderWidth) styles.push(`border: ${borderWidth}px solid ${borderColor}`);
    if (borderRadius) styles.push(`border-radius: ${borderRadius}px`);
    if (width && type !== 'line' && type !== 'article') styles.push(`width: ${width}px`);
    if (height && type !== 'line' && type !== 'article') styles.push(`height: ${height}px`);
    if (rotate) styles.push(`transform: rotate(${rotate}deg)`);
    if (type === 'line' && element.length) styles.push(`width: ${element.length}px`);
    if (type === 'article') styles.push(`display: flex; flex-direction: ${isHorizontal ? 'row' : 'column'}; flex-wrap: wrap;`);

    element.customStyles = styles.join('; ');

    if (isEditing && editingIndex >= 0) {
        if (editingArticleId) {
            elements.find(e => e.id === editingArticleId).children[editingIndex] = element;
        } else {
            elements[editingIndex] = element;
        }
    } else {
        if (section === 'main' && editingArticleId) {
            elements.find(e => e.id === editingArticleId).children.push(element);
        } else {
            elements.push(element);
        }
    }

    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
    editingArticleId = null;
    updatePreview();
}

// Обновление предварительного просмотра
function updatePreview() {
    console.log('Обновление превью, элементы:', elements);
    const preview = document.getElementById('form-preview');
    const header = document.getElementById('form-header');
    const mainElement = document.getElementById('form-main');
    const footer = document.getElementById('form-footer');
    header.innerHTML = '';
    mainElement.innerHTML = '';
    footer.innerHTML = '';

    const flexDirection = isHorizontal ? 'row' : 'column';
    header.style.flexDirection = flexDirection;
    mainElement.style.flexDirection = flexDirection;
    footer.style.flexDirection = flexDirection;

    if (isHorizontal) {
        header.classList.add('horizontal');
        mainElement.classList.add('horizontal');
        footer.classList.add('horizontal');
    } else {
        header.classList.remove('horizontal');
        mainElement.classList.remove('horizontal');
        footer.classList.remove('horizontal');
    }

    elements.forEach((element, idx) => {
        const div = createElementDiv(element, idx);
        const section = element.section || 'main';
        if (section === 'header') header.appendChild(div);
        else if (section === 'footer') footer.appendChild(div);
        else mainElement.appendChild(div);
    });

    header.style.height = `${Math.max(60, header.scrollHeight)}px`;
    mainElement.style.height = `${Math.max(200, mainElement.scrollHeight)}px`;
    footer.style.height = `${Math.max(60, footer.scrollHeight)}px`;

    const totalHeight = header.scrollHeight + mainElement.scrollHeight + footer.scrollHeight;
    preview.style.height = `${Math.max(600, totalHeight)}px`;

    applyCustomCss();
}

// Создание DOM-элемента для предварительного просмотра
function createElementDiv(element, idx, articleId = null) {
    const div = document.createElement('div');
    div.className = element.type === 'article' ? 'article-container' : 'element';
div.id = element.type === 'article' ? `article-${idx}` : `element-${idx}`;
div.dataset.indexId = idx;
if (articleId) div.dataset.articleId = articleId;
div.oncontextmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Контекстное меню:', idx, element.type, articleId);
    showContextMenu('context-menu', e);
    contextMenuElementIndex = parseInt(idx);
    contextMenuArticleId = articleId;
};

    const config = elementConfig[element.type];
    if (config) {
        const child = config.createDom(element, idx);
        if (element.type !== 'line' && element.type !== 'article') div.appendChild(child);
        else div.appendChild(child);
    }

    return div;
}

// Начало изменения размера линии
function startResize(event, indexId, side) {
    console.log('Начало изменения размера:', indexId, side);
    event.stopPropagation();
    resizingElementIndex = indexId;
    isResizing = true;

    const onMouseMove = (e) => {
        if (!isResizing || indexId !== resizingElementIndex) return;
        const element = elements[indexId];
        if (element.type !== 'line') return;

        const rect = document.getElementById('form-preview').getBoundingClientRect();
        const newX = e.clientX - rect.left;
        let newLength = element.length || 100;

        if (side === 'right') newLength = newX;
        else if (side === 'left') {
            newLength = element.length + (element.left || 0) - newX;
            element.left = Math.max(0, newX);
        }

        element.length = Math.max(10, newLength);
        element.customStyles = element.customStyles.replace(/width\s*:\s*\d+px/, `width:${element.length}px`) || `width: ${element.length}px`;
        updatePreview();
    };

    const onMouseUp = () => {
        isResizing = false;
        resizingElementIndex = -1;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Показать контекстное меню
function showContextMenu(id, event) {
    console.log('Показ контекстного меню:', id);
    hideContextMenu();

    const contextMenu = document.getElementById(id);
    if (!contextMenu) return;

    contextMenu.style.display = 'flex';
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenuVisible = true;

    document.addEventListener('mousedown', hideContextMenu);
}

// Скрыть контекстное меню
function hideContextMenu(event) {
    console.log('Скрытие контекстного меню');
    if (contextMenuVisible) {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && (!event || !contextMenu.contains(event.target))) {
            contextMenu.style.display = 'none';
            contextMenuElementIndex = -1;
            contextMenuArticleId = null;
            contextMenuVisible = false;
            document.removeEventListener('mousedown', hideContextMenu);
        }
    }
}

// Редактирование элемента
function editElement() {
    console.log('Редактирование элемента:', contextMenuElementIndex, contextMenuArticleId);
    if (contextMenuElementIndex >= 0) {
        let element;
        if (contextMenuArticleId) {
            const article = elements.find(e => e.id === contextMenuArticleId);
            if (article && article.children && article.children[contextMenuElementIndex]) {
                element = article.children[contextMenuElementIndex];
                showStyleEditor(element.type, contextMenuElementIndex, contextMenuArticleId);
            } else {
                console.error('Элемент не найден в article:', contextMenuArticleId, contextMenuElementIndex);
            }
        } else {
            element = elements[contextMenuElementIndex];
            showStyleEditor(element.type, contextMenuElementIndex, null);
        }
        hideContextMenu();
    }
}

// Удаление элемента
function deleteElement() {
    console.log('Удаление элемента:', contextMenuElementIndex, contextMenuArticleId);
    if (contextMenuElementIndex >= 0) {
        if (contextMenuArticleId) {
            elements.find(e => e.id === contextMenuArticleId).children.splice(contextMenuElementIndex, 1);
        } else {
            elements.splice(contextMenuElementIndex, 1);
        }
        updatePreview();
        hideContextMenu();
    }
}

// Применение пользовательских стилей
function applyCustomCss() {
    console.log('Применение CSS');
    customHtmlCss = document.getElementById('css-output').value || '';

    let previewCss = `
        body { font-family: Arial, sans-serif; }
        #form-header { background-color: #cce5ff; padding: 20px; border-bottom: 2px solid #339; min-height: 60px; display: flex; gap: 10px; ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'} }
        #form-main { background-color: #e6ffe6; padding: 20px; display: flex; gap: 10px; ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'} }
        #form-footer { background-color: #dcdcdc; text-align: center; padding: 10px; border-top: 2px solid #666; min-height: 60px; display: flex; gap: 10px; ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'} }
        .element.dragging, .article-container.dragging { opacity: 0.5; border: 2px dashed #007BFF; }
        .element.drag-over, .article-container.drag-over { border: 2px solid #007BFF; background-color: rgba(0, 123, 255, 0.1); }
    `;
    previewCss += customHtmlCss;

    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        if (element.type === 'article') {
            previewCss += `#${elementId} {\n    ${element.customStyles || elementConfig.article.defaultCss(element)}\n}\n`;
            element.children.forEach((child, childIdx) => {
                const childId = `${elementId}-child${childIdx}`;
                const config = elementConfig[child.type];
                if (child.customStyles) {
                    previewCss += `#${childId} {\n    ${child.customStyles};\n}\n`;
                } else if (config) {
                    previewCss += `#${childId} {\n    ${config.defaultCss(child)}\n}\n`;
                    if (config.hoverCss) previewCss += config.hoverCss(childId);
                }
            });
        } else {
            const config = elementConfig[element.type];
            if (element.customStyles) {
                previewCss += `#${elementId} {\n    ${element.customStyles};\n}\n`;
            } else if (config) {
                previewCss += `#${elementId} {\n    ${config.defaultCss(element)}\n}\n`;
                if (config.hoverCss) previewCss += config.hoverCss(elementId);
            }
        }
    });

    let styleElement = document.getElementById('preview-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'preview-style';
        document.head.appendChild(styleElement);
    }
    styleElement.textContent = previewCss;
}

// Генерация HTML и CSS кода
function generateCodeLocally() {
    console.log('Генерация кода');
    let htmlCode = `<!DOCTYPE html>\n<html lang="ru">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Generated Form</title>\n    <style>\n        body {\n            margin: 0;\n            font-family: Arial, sans-serif;\n            display: flex;\n            flex-direction: column;\n            min-height: 100vh;\n        }\n        header {\n            background-color: #cce5ff;\n            padding: 20px;\n            border-bottom: 2px solid #339;\n            min-height: 60px;\n            display: flex;\n            gap: 10px;\n            ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'};\n        }\n        main {\n            background-color: #e6ffe6;\n            padding: 20px;\n            flex-grow: 1;\n            min-height: 200px;\n            display: flex;\n            gap: 10px;\n            ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'};\n        }\n        footer {\n            background-color: #dcdcdc;\n            text-align: center;\n            padding: 10px;\n            border-top: 2px solid #666;\n            min-height: 60px;\n            display: flex;\n            gap: 10px;\n            ${isHorizontal ? 'flex-direction: row; flex-wrap: wrap; align-items: center;' : 'flex-direction: column;'};\n        }\n`;
    let cssCode = '';

    const sections = {
        header: elements.filter(e => e.section === 'header'),
        main: elements.filter(e => e.section === 'main' || !e.section),
        footer: elements.filter(e => e.section === 'footer')
    };

    htmlCode += '</style>\n</head>\n<body>\n';
    ['header', 'main', 'footer'].forEach(section => {
        htmlCode += `<${section}>\n`;
        sections[section].forEach((element, idx) => {
            const elementId = `${section}-${element.type}${idx}`;
            const config = elementConfig[element.type];
            if (config) {
                htmlCode += `    ${config.html(element, elementId)}\n`;
                if (element.type === 'article') {
                    cssCode += `#${elementId} {\n    ${element.customStyles || config.defaultCss(element)}\n}\n`;
                    element.children.forEach((child, childIdx) => {
                        const childId = `${elementId}-child${childIdx}`;
                        const childConfig = elementConfig[child.type];
                        if (child.customStyles) {
                            cssCode += `#${childId} {\n    ${child.customStyles};\n}\n`;
                        } else if (childConfig) {
                            cssCode += `#${childId} {\n    ${childConfig.defaultCss(child)}\n}\n`;
                            if (childConfig.hoverCss) cssCode += childConfig.hoverCss(childId);
                        }
                    });
                } else {
                    if (element.customStyles) {
                        cssCode += `#${elementId} {\n    ${element.customStyles};\n}\n`;
                    } else {
                        cssCode += `#${elementId} {\n    ${config.defaultCss(element)}\n}\n`;
                        if (config.hoverCss) cssCode += config.hoverCss(elementId);
                    }
                }
            }
        });
        htmlCode += `</${section}>\n`;
    });

    htmlCode += '</body>\n</html>\n';

    document.getElementById('html-output').value = htmlCode;
    document.getElementById('css-output').value = cssCode;
    customHtmlCss = cssCode;
    applyCustomCss();
}

// Сохранение формы на сервере
async function saveForm() {
    console.log('Сохранение формы');
    const formName = document.getElementById('form-name').value || 'Безымянная форма';
    const htmlOutput = document.getElementById('html-output').value;
    const cssOutput = document.getElementById('css-output').value;

    try {
        const response = await fetch('/projects/save_form/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookies('csrftoken')
            },
            body: JSON.stringify({
                name: formName,
                html_code: htmlOutput,
                css_code: cssOutput,
                react_code: '',
                react_css_code: '',
                elements: elements,
                isHorizontal: isHorizontal
            })
        });

        const result = await response.json();
        if (result.status === 'success') {
            console.log('Форма сохранена');
            alert('Форма успешно сохранена!');
        } else {
            console.error('Ошибка:', result.error);
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка сохранения: ' + error);
    }
}

// Поддержка Drag-and-Drop
function enableDragAndDrop() {
    console.log('Инициализация Drag-and-Drop');
    const preview = document.getElementById('form-preview');

    preview.addEventListener('dragstart', (e) => {
        const elementDiv = e.target.closest('.element, .article-container');
        if (!elementDiv) return;
        const index = parseInt(elementDiv.dataset.indexId);
        const articleId = elementDiv.dataset.articleId;
        e.dataTransfer.setData('text/plain', JSON.stringify({ index, articleId }));
        e.dataTransfer.effectAllowed = 'move';
        elementDiv.classList.add('dragging');
        console.log('Начало перетаскивания:', index, articleId);
    });

    preview.addEventListener('dragend', (e) => {
        const elementDiv = e.target.closest('.element, .article-container');
        if (elementDiv) {
            elementDiv.classList.remove('dragging');
        }
        console.log('Конец перетаскивания');
    });

    preview.addEventListener('dragenter', (e) => {
        e.preventDefault();
        const targetDiv = e.target.closest('.element, .article-container');
        if (targetDiv) {
            targetDiv.classList.add('drag-over');
        }
    });

    preview.addEventListener('dragleave', (e) => {
        const targetDiv = e.target.closest('.element, .article-container');
        if (targetDiv) {
            targetDiv.classList.remove('drag-over');
        }
    });

    preview.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    preview.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetDiv = e.target.closest('.element, .article-container');
        if (!targetDiv) return;

        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const sourceIndex = data.index;
        const sourceArticleId = data.articleId;
        const targetIndex = parseInt(targetDiv.dataset.indexId);
        const targetArticleId = targetDiv.dataset.articleId;

        if (sourceIndex === targetIndex && sourceArticleId === targetArticleId) return;

        let sourceElement, sourceArray;
        if (sourceArticleId) {
            sourceArray = elements.find(e => e.id === sourceArticleId).children;
            sourceElement = sourceArray[sourceIndex];
        } else {
            sourceArray = elements;
            sourceElement = sourceArray[sourceIndex];
        }

        let targetArray;
        if (targetDiv.classList.contains('article-container')) {
            const article = elements[targetIndex];
            if (article.type !== 'article') return;
            targetArray = article.children;
        } else if (targetArticleId) {
            targetArray = elements.find(e => e.id === targetArticleId).children;
        } else {
            targetArray = elements;
        }

        if (sourceArray === targetArray && sourceIndex === targetIndex) return;

        console.log(`Перетаскивание: ${sourceIndex} (${sourceArticleId || 'root'}) -> ${targetIndex} (${targetArticleId || 'root'})`);

        sourceArray.splice(sourceIndex, 1);
        if (sourceElement.type === 'article' && targetArray === elements) {
            targetArray.splice(targetIndex, 0, sourceElement);
        } else if (sourceElement.type !== 'article') {
            targetArray.splice(targetIndex, 0, sourceElement);
        }

        targetDiv.classList.remove('drag-over');
        updatePreview();
        saveForm();
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    if (window.projectElements) {
        elements = window.projectElements;
        articleCounter = elements.filter(e => e.type === 'article').length;
    }
    updatePreview();
    const formSizeSelect = document.getElementById('form-size');
    if (formSizeSelect) formSizeSelect.addEventListener('change', changeFormSize);
    enableDragAndDrop();
});