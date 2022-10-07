"use strict";

const books = [];
const RENDER_EVENT = "book-render";
const STORAGE_KEY = "book-app";

const search = document.getElementById("search-text");
const modal = document.querySelector("#modal");
const modalTitle = document.getElementById("modal-title");
let statusSave = null; //0 = edit; 1 = new; -1 = delete

// input
const id = document.getElementById("book-id");
const title = document.getElementById("book-title");
const author = document.getElementById("book-author");
const publisher = document.getElementById("book-publisher");
const year = document.getElementById("book-year");
const isComplete = document.getElementById("book-iscomplete");
const isFavorite = document.getElementById("book-isfavorite");

document.addEventListener(RENDER_EVENT, function () {
	const obj = books.filter(function (v, i) {
		if (
			v.title.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 ||
			v.author.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 ||
			v.publisher.toLowerCase().indexOf(search.value.toLowerCase()) >= 0
		) {
			return true;
		} else false;
	});
	if (obj.length == 0) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Tidak ada data untuk ditampilkan.",
		});
	} else {
		renderBooks(obj);
	}
});

document.addEventListener("DOMContentLoaded", function () {
	// modalShow();
	//check storage
	if (isStorageExist()) loadDataFromStorage();

	//form input
	const submitForm = document.getElementById("inputBook");
	submitForm.addEventListener("submit", function (event) {
		event.preventDefault();
		saveBook();
	});

	//form search
	const searchForm = document.getElementById("search-form");
	searchForm.addEventListener("submit", function (event) {
		event.preventDefault();
		document.dispatchEvent(new Event(RENDER_EVENT));
	});

	// reset search
	const resetSearch = document.getElementById("reset-search");
	resetSearch.addEventListener("click", function () {
		renderBooks(books);
	});

	//add new complete
	const addBookComplete = document.getElementById("add-book-a");
	addBookComplete.addEventListener("click", function () {
		showModal();
		clearInput(false);
	});

	//add new uncomplete
	const addBookUncomplete = document.getElementById("add-book-b");
	addBookUncomplete.addEventListener("click", function () {
		showModal();
		clearInput(true);
	});
});

function isStorageExist() {
	if (typeof Storage === undefined) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Browser kamu tidak mendukung local storage!",
		});
		return false;
	}
	return true;
}

function loadDataFromStorage() {
	const serializedData = localStorage.getItem(STORAGE_KEY);

	if (!serializedData) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Belum ada data untuk ditampilkan. Silakan input data!",
		});
		return;
	}

	let data = JSON.parse(serializedData);
	if (data !== null) {
		for (const book of data) {
			books.push(book);
		}
	}
	document.dispatchEvent(new Event(RENDER_EVENT));
}

function generateBookObject(
	id,
	title,
	author,
	publisher,
	year,
	isComplete,
	isFavorite
) {
	return {
		id,
		title,
		author,
		publisher,
		year,
		isComplete,
		isFavorite,
	};
}

function saveBook() {
	//validasi tahun
	if (year.value.length != 4) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Harus empat digit!",
		});
		return;
	}

	// edit book
	if (id.value.length > 0) {
		const old = findBook(parseInt(id.value));
		old.title = title.value;
		old.author = author.value;
		old.publisher = publisher.value;
		old.year = year.value;
		old.isComplete = isComplete.checked;
		old.isFavorite = isFavorite.checked;
		statusSave = 0;
	} else {
		// new book
		const bookObject = generateBookObject(
			+new Date(),
			title.value,
			author.value,
			publisher.value,
			year.value,
			isComplete.checked,
			isFavorite.checked
		);
		books.push(bookObject);
		statusSave = 1;
	}
	document.dispatchEvent(new Event(RENDER_EVENT));
	saveDataStorage();
}

function clearInput(check = false) {
	id.value = "";
	title.value = "";
	author.value = "";
	publisher.value = "";
	year.value = "";
	if (check) {
		isComplete.checked = true;
	} else {
		isComplete.checked = false;
	}
}

function saveDataStorage(message = true) {
	if (isStorageExist()) {
		const parsed = JSON.stringify(books);
		localStorage.setItem(STORAGE_KEY, parsed);

		modalHide();
		if (message) {
			let text;
			if (statusSave == 0) {
				text = "Data buku berhasil diupdate";
			} else if (statusSave == 1) {
				text = "Buku baru berhasil ditambahkan";
			} else if (statusSave == -1) {
				text = "Buku berhasil dihapus";
			}
			Swal.fire({
				icon: "success",
				title: text,
				showConfirmButton: false,
				timer: 1500,
			});
		}
	}
}

function renderBooks(obj) {
	const completed = document.getElementById("table-complete");
	completed.innerHTML = "";

	const uncompleted = document.getElementById("table-uncomplete");
	uncompleted.innerHTML = "";

	for (const bookItem of obj) {
		const bookElement = makeBook(bookItem);
		if (!bookItem.isComplete) uncompleted.append(bookElement);
		else completed.append(bookElement);
	}
}

function findBookID(id) {
	for (const index in books) {
		if (books[index].id === id) {
			return index;
		}
	}
	return -1;
}

function findBook(id) {
	for (const book of books) {
		if (book.id == id) {
			return book;
		}
	}
	return null;
}

function deleteBook(id) {
	const target = findBookID(id);
	if (target === -1) return;

	Swal.fire({
		title: "Yakin mau menghapus buku ini?",
		icon: "question",
		showCancelButton: true,
		confirmButtonText: "Ya. Hapus",
		confirmCancelText: "Tidak",
	}).then((result) => {
		if (result.isConfirmed) {
			Swal.fire({
				icon: "success",
				title: "Buku Dihapus!",
				showConfirmButton: false,
				timer: 1500,
			});

			books.splice(target, 1);
			document.dispatchEvent(new Event(RENDER_EVENT));
			statusSave = -1;
			saveDataStorage();
		}
	});
}

function completeBook(id, updateTo) {
	const target = findBook(id);
	if (target == null) return;

	let text;
	if (updateTo) {
		text = "Ganti status buku menjadi sudah dibaca?";
	} else {
		text = "Ganti status buku menjadi belum dibaca?";
	}
	Swal.fire({
		title: text,
		icon: "question",
		showCancelButton: true,
		confirmButtonText: "Ya",
		cancelButtonText: "Tidak",
	}).then((result) => {
		if (result.isConfirmed) {
			if (updateTo) {
				target.isComplete = true;
			} else {
				target.isComplete = false;
			}
			document.dispatchEvent(new Event(RENDER_EVENT));
			saveDataStorage(false);
			Swal.fire({
				icon: "success",
				title: "Status buku disimpan.",
				showConfirmButton: false,
				timer: 1500,
			});
		}
	});
}

function favoriteBook(id, updateTo) {
	const target = findBook(id);
	if (target == null) return;

	let text;
	if (updateTo) {
		text = "Tambahkan ke favorit";
	} else {
		text = "Hapus dari favorit";
	}
	Swal.fire({
		title: text,
		icon: "question",
		showCancelButton: true,
		confirmButtonText: "Ya",
		cancelButtonText: "Tidak",
	}).then((result) => {
		if (result.isConfirmed) {
			if (updateTo) {
				target.isFavorite = true;
			} else {
				target.isFavorite = false;
			}
			document.dispatchEvent(new Event(RENDER_EVENT));
			saveDataStorage(false);
			Swal.fire({
				icon: "success",
				title: "Status buku disimpan.",
				showConfirmButton: false,
				timer: 1500,
			});
		}
	});
}

function editBook(idBook) {
	const target = findBook(idBook);
	if (target == null) return;
	// attachObject(target);
	id.value = target.id;
	title.value = target.title;
	author.value = target.author;
	publisher.value = target.publisher;
	year.value = target.year;
	target.isComplete
		? (isComplete.checked = true)
		: (isComplete.checked = false);

	target.isFavorite
		? (isFavorite.checked = true)
		: (isFavorite.checked = false);
	showModal("Edit Buku");
}

function makeBook(objBook) {
	const tr = document.createElement("tr");

	const iTitle = document.createElement("td");
	const iAuthor = document.createElement("td");
	const iPublisher = document.createElement("td");
	const iYear = document.createElement("td");
	const iButton = document.createElement("td");

	iTitle.innerText = objBook.title;
	iAuthor.innerText = objBook.author;
	iPublisher.innerText = objBook.publisher;
	iYear.innerText = objBook.year;

	const btnComplete = document.createElement("button");
	btnComplete.classList.add("btn", "btn-success", "btn-action"); //tak perlu
	if (objBook.isComplete) {
		btnComplete.innerHTML = "<i class='bi bi-check-circle-fill'></i>";
		btnComplete.addEventListener("click", function () {
			completeBook(objBook.id, false);
		});
	} else {
		btnComplete.innerHTML = "<i class='bi bi-check-circle'></i>";
		btnComplete.addEventListener("click", function () {
			completeBook(objBook.id, true);
		});
	}

	const btnEdit = document.createElement("button");
	btnEdit.innerHTML = "<i class='bi bi-pencil-square'></i>";
	btnEdit.classList.add("btn", "btn-warning", "btn-action");
	btnEdit.addEventListener("click", function () {
		editBook(objBook.id);
	});

	const btnDelete = document.createElement("button");
	btnDelete.innerHTML = '<i class="bi bi-trash-fill"></i>';
	btnDelete.classList.add("btn", "btn-danger", "btn-action");
	btnDelete.addEventListener("click", function () {
		deleteBook(objBook.id);
	});

	const btnFavorite = document.createElement("button");
	btnFavorite.classList.add("btn", "btn-primary", "btn-action");
	if (objBook.isFavorite) {
		btnFavorite.innerHTML = "<i class='bi bi-heart-fill'></i>";
		btnFavorite.addEventListener("click", function () {
			favoriteBook(objBook.id, false);
		});
	} else {
		btnFavorite.innerHTML = "<i class='bi bi-heart'></i>";
		btnFavorite.addEventListener("click", function () {
			favoriteBook(objBook.id, true);
		});
	}
	iButton.append(btnComplete, btnEdit, btnDelete, btnFavorite);

	tr.append(iTitle, iAuthor, iPublisher, iYear, iButton);
	tr.setAttribute("id", `book-${objBook.id}`);

	return tr;
}

function showModal(judul = "Input Buku Baru") {
	modal.classList.add("is-visible");
	modalTitle.innerText = judul;
}

function hideModal() {
	modal.classList.remove("is-visible");
}

document.addEventListener("keyup", (e) => {
	if (e.key == "Escape" && modal) {
		hideModal();
	}
});
