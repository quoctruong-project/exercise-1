const fs = require("fs");

// Đọc dữ liệu từ file comments.json
fs.readFile("comments.json", (err, data) => {
  if (err) throw err;

  // Parse JSON dữ liệu sang Javascript object
  const comments = JSON.parse(data);

  // Tạo tree comment và hiển thị kết quả
  const tree = createCommentTree(comments);
  const sorted = sortArrayByCreatedAt(tree);
  // console.log(sorted);
  logItemsWithPrefix(sorted);
});

// Hàm tạo tree comment
function createCommentTree(comments) {
  const tree = [];

  // Duyệt qua từng comment
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];

    if (comment.replyingTo == undefined) {
      // Nếu không phải là reply, thì đây là comment gốc Level 0
      tree.push(formatComment(i, comment, 0));
    } else {
      // Nếu là reply, tìm comment gốc
      const parentComment = findById(tree, comment.replyingTo);
      if (!parentComment) continue;

      let level = parentComment.level + 1;

      // Thêm comment vào sublist của comment gốc
      if (!parentComment.replies) {
        // Nếu chưa có sublist, tạo mới sublist và thêm vào đó
        parentComment.replies = [formatComment(i, comment, level)];
      } else {
        // Nếu đã có sublist, thêm comment vào sublist
        parentComment.replies.push(formatComment(i, comment, level));
      }
    }
  }
  return tree;
}

// Hàm format thông tin của comment thành chuỗi Markdown
function formatComment(id, comment, level) {
  const username = comment.username;
  const content = comment.content;
  const createdAt = getTimeDiff(comment.createdAt);

  return {
    id: id,
    content: `${username}: ${content} (${createdAt})`,
    level: level,
    createdAt: comment.createdAt,
  };
}

// Hàm tính khoảng thời gian giữa thời điểm tạo comment và thời điểm hiện tại
function getTimeDiff(createdAt) {
  const now = new Date().getTime();
  const diff = Math.floor((now - createdAt) / 1000);

  if (diff < 60) {
    return `${diff} giây trước`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} phút trước`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days} ngày trước`;
  }
}

function findById(array, id) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item.id === id) {
      return item;
    }
    if (item.replies) {
      const found = findById(item.replies, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function compareItemsByCreatedAt(item1, item2) {
  return item1.createdAt - item2.createdAt;
}

function sortArrayByCreatedAt(array) {
  for (let i = 1; i < array.length; i++) {
    const current = array[i];
    let j = i - 1;
    while (j >= 0 && compareItemsByCreatedAt(array[j], current) > 0) {
      array[j + 1] = array[j];
      j--;
    }
    array[j + 1] = current;
    if (current.replies) {
      current.replies = sortArrayByCreatedAt(current.replies);
    }
  }
  return array;
}

function logItemsWithPrefix(array, prefix = "-") {
  array.forEach((item) => {
    console.log(
      `${item.level == 0 ? prefix : prefix.repeat(item.level * 4)} ${
        item.content
      }`
    );
    if (item.replies && item.replies.length > 0) {
      logItemsWithPrefix(item.replies, `${prefix}`);
    }
  });
}
