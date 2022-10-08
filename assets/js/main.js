"use strict";

const books = [];
const RENDER_EVENT = "book-render";
const STORAGE_KEY = "book-app";

const search = document.getElementById("search-text");
const modal = document.querySelector("#modal");
const modalTitle = document.getElementById("modal-title");
let statusSave = null; //0 = edit; 1 = baru; -1 = hapus

// input
const id = document.getElementById("book-id");
const title = document.getElementById("book-title");
const author = document.getElementById("book-author");
const publisher = document.getElementById("book-publisher");
const year = document.getElementById("book-year");
const isRead = document.getElementById("book-isread");
const isFavorite = document.getElementById("book-isfavorite");

document.addEventListener(RENDER_EVENT, function () {
	const object = books.filter(function (v, i) {
		if (
			v.title.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 ||
			v.author.toLowerCase().indexOf(search.value.toLowerCase()) >= 0 ||
			v.publisher.toLowerCase().indexOf(search.value.toLowerCase()) >= 0
		) {
			return true;
		} else false;
	});
	if (object.length == 0) {
		Swal.fire({
			icon: "error",
			title: "Oops...",
			text: "Tidak ada data untuk ditampilkan.",
		});
	} else {
		renderBooks(object);
	}
});

document.addEventListener("DOMContentLoaded", function () {
	// showModal();
	//check storage
	if (isStorageExist()) loadDataFromStorage();

	//form input
	const submitForm = document.getElementById("input-book");
	submitForm.addEventListener("submit", function (event) {
		event.preventDefault();
		saveBook();
	});

	//form pencarian
	const searchForm = document.getElementById("search-form");
	searchForm.addEventListener("submit", function (event) {
		event.preventDefault();
		document.dispatchEvent(new Event(RENDER_EVENT));
	});

	// reset pencarian
	const resetSearch = document.getElementById("reset-search");
	resetSearch.addEventListener("click", function () {
		renderBooks(books);
	});

	//add new read
	const addBookRead = document.getElementById("add-book-a");
	addBookRead.addEventListener("click", function () {
		showModal();
		clearInputForm(false);
	});

	//add new unread
	const addBookUnread = document.getElementById("add-book-b");
	addBookUnread.addEventListener("click", function () {
		showModal();
		clearInputForm(true);
	});
});

document.addEventListener("keyup", (e) => {
	if (e.key == "Escape" && modal) {
		hideModal();
	}
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
	isRead,
	isFavorite
) {
	return {
		id,
		title,
		author,
		publisher,
		year,
		isRead,
		isFavorite,
	};
}

function saveBook() {
	// validasi
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
		old.isRead = isRead.checked;
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
			isRead.checked,
			isFavorite.checked
		);
		books.push(bookObject);
		statusSave = 1;
	}
	document.dispatchEvent(new Event(RENDER_EVENT));
	saveDataToStorage();
}

function clearInputForm(check = false) {
	id.value = "";
	title.value = "";
	author.value = "";
	publisher.value = "";
	year.value = "";
	if (check) {
		isRead.checked = true;
	} else {
		isRead.checked = false;
	}
}

function saveDataToStorage(message = true) {
	if (isStorageExist()) {
		const stringJSON = JSON.stringify(books);
		localStorage.setItem(STORAGE_KEY, stringJSON);

		hideModal();
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

function renderBooks(books) {
	const read = document.getElementById("table-read");
	read.innerHTML = "";

	const unread = document.getElementById("table-unread");
	unread.innerHTML = "";

	for (const book of books) {
		const bookElement = makeBook(book);
		if (!book.isRead) unread.append(bookElement);
		else read.append(bookElement);
	}
}

function findID(id) {
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
	const target = findID(id);
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
			saveDataToStorage();
		}
	});
}

function isReadBook(id, isRead) {
	const target = findBook(id);
	if (target == null) return;
	let message;
	if (isRead) {
		message = "Ganti status buku menjadi sudah dibaca?";
	} else {
		message = "Ganti status buku menjadi belum dibaca?";
	}
	const isFavorite = target.isFavorite;
	updateStatusBook(target, message, isRead, isFavorite);
}

function isFavoriteBook(id, isFavorite) {
	const target = findBook(id);
	if (target == null) return;
	let message;
	if (isFavorite) {
		message = "Tambahkan ke favorit";
	} else {
		message = "Hapus dari favorit";
	}
	const isRead = target.isRead;
	updateStatusBook(target, message, isRead, isFavorite);
}

function updateStatusBook(target, text, isRead, isFavorite) {
	Swal.fire({
		title: text,
		icon: "question",
		showCancelButton: true,
		confirmButtonText: "Ya",
		cancelButtonText: "Tidak",
	}).then((result) => {
		if (result.isConfirmed) {
			if (isRead) {
				target.isRead = true;
			} else {
				target.isRead = false;
			}
			if (isFavorite) {
				target.isFavorite = true;
			} else {
				target.isFavorite = false;
			}
			document.dispatchEvent(new Event(RENDER_EVENT));
			saveDataToStorage(false);
			Swal.fire({
				icon: "success",
				title: "Status buku disimpan.",
				showConfirmButton: false,
				timer: 1500,
			});
		}
	});
}
function editBook(bookID) {
	const target = findBook(bookID);
	if (target == null) return;
	// attachObject(target);
	id.value = target.id;
	title.value = target.title;
	author.value = target.author;
	publisher.value = target.publisher;
	year.value = target.year;
	target.isRead ? (isRead.checked = true) : (isRead.checked = false);

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

	const btnRead = document.createElement("button");
	btnRead.classList.add("btn", "btn-success", "btn-action"); //tak perlu
	if (objBook.isRead) {
		btnRead.innerHTML = "<i class='fa-solid fa-circle-check'></i>";
		btnRead.addEventListener("click", function () {
			isReadBook(objBook.id, false);
		});
	} else {
		btnRead.innerHTML = "<i class='fa-regular fa-circle-check'></i>";
		btnRead.addEventListener("click", function () {
			isReadBook(objBook.id, true);
		});
	}

	const btnEdit = document.createElement("button");
	btnEdit.innerHTML = "<i class='fa-solid fa-pen-to-square'></i>";
	btnEdit.classList.add("btn", "btn-warning", "btn-action");
	btnEdit.addEventListener("click", function () {
		editBook(objBook.id);
	});

	const btnDelete = document.createElement("button");
	btnDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
	btnDelete.classList.add("btn", "btn-danger", "btn-action");
	btnDelete.addEventListener("click", function () {
		deleteBook(objBook.id);
	});

	const btnFavorite = document.createElement("button");
	btnFavorite.classList.add("btn", "btn-primary", "btn-action");
	if (objBook.isFavorite) {
		btnFavorite.innerHTML = "<i class='fa-solid fa-heart'></i>";
		btnFavorite.addEventListener("click", function () {
			isFavoriteBook(objBook.id, false);
		});
	} else {
		btnFavorite.innerHTML = "<i class='fa-regular fa-heart'></i>";
		btnFavorite.addEventListener("click", function () {
			isFavoriteBook(objBook.id, true);
		});
	}
	iButton.append(btnRead, btnEdit, btnDelete, btnFavorite);

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
