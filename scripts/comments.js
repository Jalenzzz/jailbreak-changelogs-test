function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

class CommentsManager {
  constructor(type, itemId, itemName = null) {
    if (window.commentsManagerInstance) {
      return window.commentsManagerInstance;
    }
    toastr.options = {
      positionClass: "toast-bottom-right",
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
    };

    this.type = type;
    this.itemId = itemId;
    this.itemName = itemName;
    this.currentPage = 1;
    this.commentsPerPage = 7;
    this.comments = [];
    this.currentEditingComment = null;
    this._isLoading = false;
    this._renderTimeout = null;

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeElements();
        this.setupEventListeners();
      });
    } else {
      this.initializeElements();
      this.setupEventListeners();
    }

    window.commentsManagerInstance = this;
    return this;
  }

  checkLoginStatus() {
    const token = getCookie("token");

    if (!this.input || !this.submitBtn) {
      console.error("[Debug] Elements not found in checkLoginStatus");
      return false;
    }

    if (!token) {
      this.input.disabled = true;
      this.input.placeholder = "Please login to comment";
      this.submitBtn.textContent = "Login";
      this.submitBtn.classList.add("btn-secondary");
      this.submitBtn.classList.remove("btn-primary");
      // Don't disable the button when not logged in, so it can be clicked to redirect to login
      this.submitBtn.disabled = false;
      return false;
    }

    this.input.disabled = false;
    this.input.placeholder = "Write a comment...";
    this.submitBtn.textContent = "Submit";
    this.submitBtn.classList.add("btn-primary");
    this.submitBtn.classList.remove("btn-secondary");
    this.submitBtn.disabled = false; // Make sure to enable the submit button
    return true;
  }

  initializeElements() {
    this.form = document.getElementById("comment-form");
    this.input = document.getElementById("commenter-text");
    this.submitBtn = document.getElementById("submit-comment");
    this.commentsList = document.getElementById("comments-list");
    this.paginationControls = document.getElementById("paginationControls");
    this.commentsHeader = document.getElementById("comment-header");

    const editModalElement = document.getElementById("editCommentModal");

    if (
      !this.form ||
      !this.input ||
      !this.submitBtn ||
      !this.commentsList ||
      !this.paginationControls ||
      !this.commentsHeader ||
      !editModalElement
    ) {
      console.error("[Debug] Required comment elements not found!");
      return false;
    }

    this.editModal = new bootstrap.Modal(editModalElement);

    // Initialize input state
    this.input.disabled = !this.checkLoginStatus();
    this.input.placeholder = this.checkLoginStatus()
      ? "Write a comment..."
      : "Login to comment";

    return true;
  }

  setupEventListeners() {
    if (!this.form || !this.input || !this.submitBtn) {
      console.error(
        "[Debug] Cannot setup event listeners - elements not found"
      );
      return;
    }

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const content = this.input.value.trim();

      if (!this.checkLoginStatus()) {
        window.location.href = "/login";
        return;
      }

      if (!content) {
        return;
      }

      this.submitComment();
    });

    // Setup save edited comment button
    const saveEditBtn = document.getElementById("saveCommentEdit");
    if (saveEditBtn) {
      saveEditBtn.addEventListener("click", () => this.saveEditedComment());
    }

    // Initial login status check
    this.checkLoginStatus();
  }

  // In comments.js
  updateCommentsHeader() {
    if (!this.commentsHeader) return;

    let headerText;
    switch (this.type) {
      case "changelog":
        headerText = `Comments for Changelog #${this.itemId}`;
        break;
      case "season":
        headerText = `Comments for Season ${this.itemId}`;
        break;
      default:
        // For items (vehicles, rims, etc.)
        if (this.itemName) {
          headerText = `Comments for ${this.itemName} [${
            this.type.charAt(0).toUpperCase() + this.type.slice(1)
          }]`;
        } else {
          headerText = `Comments for ${
            this.type.charAt(0).toUpperCase() + this.type.slice(1)
          } #${this.itemId}`;
        }
    }
    this.commentsHeader.textContent = headerText;
  }

  clearComments() {
    this.comments = [];
    this.currentPage = 1;
    this.commentsList.innerHTML = "";
    this.paginationControls.style.display = "none";
  }

  async loadComments() {
    if (this._isLoading) return; // Prevent concurrent loads
    this._isLoading = true;

    // Clear existing comments and update header first
    this.clearComments();

    // Show loading state
    this.commentsList.innerHTML = `
      <li class="list-group-item comments-loading">
        <div class="spinner mb-2"></div>
        <div>Loading comments...</div>
      </li>
    `;

    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/comments/get?type=${this.type}&id=${this.itemId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );

      // Handle 404 (no comments) separately
      // In loadComments method, update the 404 handler:
      if (response.status === 404) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center" style="background-color: #212a31;">
            <div class="py-3">
              <i class="bi bi-chat-left-dots mb-2" style="font-size: 1.5rem; color: #6c757d;"></i>
              <p class="mb-0 text-muted">No comments yet</p>
              <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
            </div>
          </li>
        `;
        this._isLoading = false;
        // Ensure pagination is hidden
        this.paginationControls.style.display = "none";
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch comments");

      const data = await response.json();
      this.comments = data;

      this.renderComments();
    } catch (error) {
      console.error("[CommentsManager] Error loading comments:", error);
      this.commentsList.innerHTML = `
        <li class="list-group-item text-center text-danger">
          <i class="bi bi-exclamation-circle me-2"></i>
          Failed to load comments. Please try again.
        </li>
      `;
      if (!error.message.includes("404")) {
        toastr.error("Failed to load comments. Please try again.");
      }
    } finally {
      this._isLoading = false;
    }
  }
  renderComments() {
    if (this._renderTimeout) {
      clearTimeout(this._renderTimeout);
    }

    this._renderTimeout = setTimeout(() => {
      this.commentsList.innerHTML = "";

      if (this.comments.length === 0) {
        this.commentsList.innerHTML = `
          <li class="list-group-item text-center" style="background-color: #212a31;">
            <div class="py-3">
              <i class="bi bi-chat-left-dots mb-2" style="font-size: 1.5rem; color: #6c757d;"></i>
              <p class="mb-0 text-muted">No comments yet</p>
              <p class="small text-muted mb-0">Be the first to share your thoughts!</p>
            </div>
          </li>
        `;
        // Hide pagination when there are no comments
        this.paginationControls.style.display = "none";
        return;
      }

      // Calculate pagination but maintain original order
      const startIndex = (this.currentPage - 1) * this.commentsPerPage;
      const endIndex = startIndex + this.commentsPerPage;
      const commentsToShow = this.comments.slice(startIndex, endIndex);

      for (let i = 0; i < commentsToShow.length; i++) {
        this.renderCommentItem(commentsToShow[i]);
      }

      // Only show pagination if there are enough comments
      const totalPages = Math.ceil(this.comments.length / this.commentsPerPage);
      if (totalPages > 1) {
        this.renderPagination(totalPages);
        this.paginationControls.style.display = "flex";
      } else {
        this.paginationControls.style.display = "none";
      }
    }, 50); // Small delay to prevent multiple renders
  }

  async renderCommentItem(comment) {
    const token = getCookie("token");
    let isOwner = false;

    if (token) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
        );

        if (response.ok) {
          const userData = await response.json();

          isOwner = userData.id === comment.user_id;
        }
      } catch (error) {
        console.error("Error verifying comment ownership:", error);
      }
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    };

    const displayDate = comment.edited_at
      ? `Last edited ${formatDate(comment.edited_at)}`
      : formatDate(comment.date);

    const fallbackAvatar = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      comment.author
    )}&bold=true&format=svg`;

    const li = document.createElement("li");
    li.className = "list-group-item comment-item";
    li.dataset.commentId = comment.id;

    // In renderCommentItem, modify the HTML template:
    li.innerHTML = `
    <div class="d-flex align-items-start">
      <img src="${fallbackAvatar}" 
          class="rounded-circle me-2" 
          width="40" 
          height="40"
          onerror="this.src='${fallbackAvatar}'"
          alt="${comment.author}'s avatar">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">
              <a href="/users/${comment.user_id}" class="comment-author">${
      comment.author
    }</a>
            </h6>
            <small class="text-muted">
             ${displayDate}
            </small>
          </div>
          ${
            isOwner
              ? `
            <div class="comment-actions">
              <button class="comment-actions-toggle" aria-label="Comment actions">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <div class="comment-actions-menu d-none">
                <button class="comment-action-item edit-comment">
                  <i class="bi bi-pencil me-2"></i>Edit
                </button>
                <button class="comment-action-item delete-comment delete">
                  <i class="bi bi-trash me-2"></i>Delete
                </button>
              </div>
            </div>
          `
              : ""
          }
        </div>
        <p class="comment-text mb-0">${this.escapeHtml(comment.content)}</p>
      </div>
    </div>
    `;

    if (comment.user_id) {
      this.fetchUserDetails(comment.user_id)
        .then((userDetails) => {
          if (userDetails && userDetails.avatar) {
            const avatarImg = li.querySelector("img");
            const gifUrl = `https://cdn.discordapp.com/avatars/${userDetails.id}/${userDetails.avatar}.gif?size=128`;
            fetch(gifUrl, { method: "HEAD" })
              .then((response) => {
                if (response.ok) {
                  avatarImg.src = gifUrl;
                } else {
                  avatarImg.src = `https://cdn.discordapp.com/avatars/${userDetails.id}/${userDetails.avatar}.webp?size=128`;
                }
              })
              .catch(() => {
                avatarImg.src = `https://cdn.discordapp.com/avatars/${userDetails.id}/${userDetails.avatar}.webp?size=128`;
              });
          }
        })
        .catch((error) => {
          console.error("Error setting avatar:", error);
        });
    }

    if (isOwner) {
      this.setupCommentActions(li, comment);
    }

    this.commentsList.appendChild(li);
  }

  async fetchUserDetails(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/?id=${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user details");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }

  renderPagination(totalPages) {
    if (totalPages <= 1) {
      this.paginationControls.style.display = "none";
      return;
    }

    this.paginationControls.style.display = "flex";
    this.paginationControls.innerHTML = `
      <button class="btn btn-sm btn-primary pagination-btn me-2" 
              ${this.currentPage === 1 ? "disabled" : ""}>
        <i class="bi bi-chevron-left"></i>
      </button>
      <button class="btn btn-sm btn-primary pagination-btn ms-2" 
              ${this.currentPage === totalPages ? "disabled" : ""}>
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    const [prevBtn, nextBtn] =
      this.paginationControls.querySelectorAll("button");
    prevBtn.addEventListener("click", () =>
      this.changePage(this.currentPage - 1)
    );
    nextBtn.addEventListener("click", () =>
      this.changePage(this.currentPage + 1)
    );
  }

  changePage(newPage) {
    if (
      newPage < 1 ||
      newPage > Math.ceil(this.comments.length / this.commentsPerPage)
    ) {
      return;
    }
    this.currentPage = newPage;
    this.renderComments();
  }

  setupCommentActions(commentElement, comment) {
    const toggleBtn = commentElement.querySelector(".comment-actions-toggle");
    const menu = commentElement.querySelector(".comment-actions-menu");
    const editBtn = commentElement.querySelector(".edit-comment");
    const deleteBtn = commentElement.querySelector(".delete-comment");

    if (!toggleBtn || !menu || !editBtn || !deleteBtn) {
      console.warn(
        "[Debug] Missing some action elements for comment:",
        comment.id
      );
      return;
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("d-none");
    });

    document.addEventListener("click", () => {
      menu.classList.add("d-none");
    });

    if (editBtn) {
      editBtn.addEventListener("click", () => this.editComment(comment));
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.deleteComment(comment.id));
    }
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async submitComment() {
    if (!this.input) {
      console.error("[Debug] Input element not found");
      return;
    }

    const content = this.input.value.trim();

    if (!content) {
      return;
    }

    const token = getCookie("token");
    if (!token) {
      console.error("[Debug] No token found, submission cancelled");
      return;
    }

    try {
      const userResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );

      if (!userResponse.ok) {
        console.error("[Debug] Failed to get user data:", userResponse.status);
        throw new Error("Failed to get user data");
      }
      const userData = await userResponse.json();

      const commentData = {
        author: userData.username,
        content: content,
        item_id: this.itemId,
        item_type: this.type,
        user_id: userData.id,
        owner: token,
      };

      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/comments/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify(commentData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      this.input.value = "";
      await this.loadComments();
      toastr.success("Comment added successfully");
    } catch (error) {
      console.error("[Debug] Error in submitComment:", error);
      toastr.error("Failed to post comment. Please try again.");
    }
  }

  async deleteComment(commentId) {
    const token = getCookie("token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      // First get user data to get the author
      const userResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );

      if (!userResponse.ok) {
        throw new Error("Failed to get user data");
      }

      const userData = await userResponse.json();

      // Now send delete request with correct field names
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/comments/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            id: String(commentId),
            author: token,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete comment");

      toastr.success("Comment deleted successfully");
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Wait for toastr to show before refresh
    } catch (error) {
      console.error("Error deleting comment:", error);
      toastr.error("Failed to delete comment. Please try again.");
    }
  }

  editComment(comment) {
    if (!this.editModal) {
      console.error("[Debug] Edit modal not initialized");
      return;
    }

    const editCommentText = document.getElementById("editCommentText");
    if (!editCommentText) {
      console.error("[Debug] Edit comment text area not found");
      return;
    }

    this.currentEditingComment = comment;
    editCommentText.value = comment.content;
    this.editModal.show();
  }

  async saveEditedComment() {
    if (!this.currentEditingComment) return;
    if (!this.editModal) {
      console.error("[Debug] Edit modal not initialized");
      return;
    }

    const token = getCookie("token");
    if (!token) return;

    const editCommentText = document.getElementById("editCommentText");
    if (!editCommentText) {
      console.error("[Debug] Edit comment text area not found");
      return;
    }

    const newContent = document.getElementById("editCommentText").value.trim();
    if (!newContent) return;

    try {
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/comments/edit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            id: this.currentEditingComment.id,
            content: newContent,
            author: token,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to edit comment");

      this.editModal.hide();
      toastr.success("Comment edited successfully");
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Wait for toastr to show before refresh
    } catch (error) {
      console.error("Error editing comment:", error);
      toastr.error("Failed to edit comment. Please try again.");
    }
  }
}
