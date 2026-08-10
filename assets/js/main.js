/**
 * Karviyam Store - Main JavaScript
 */

// Add to Cart via AJAX
function addToCart(productId, quantity, size = null) {
    if (size === null) {
        // Try to get from hidden input if on product page
        const sizeInput = document.getElementById('selectedSize');
        if (sizeInput) {
            size = sizeInput.value;
            if (!size) {
                alert('Please select a size first!');
                return;
            }
        }
    }

    const data = new FormData();
    data.append('product_id', productId);
    data.append('quantity', quantity);
    if (size) data.append('size', size);

    fetch('../ajax/add_to_cart.php', {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Update cart badge
            const badges = document.querySelectorAll('.icon-badge');
            badges.forEach(badge => {
                badge.innerText = result.cart_count;
            });
            
            // Show toast or alert
            alert(result.message);
        } else {
            alert('Error: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Update Quantity in Cart
function updateQuantity(productId, size, change) {
    const data = new FormData();
    data.append('product_id', productId);
    data.append('size', size);
    data.append('quantity', change);
    data.append('action', 'update');

    fetch('../ajax/add_to_cart.php', {
        method: 'POST',
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            location.reload(); // Simple reload to update totals
        }
    });
}
