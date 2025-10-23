import { query } from './database.js';

export async function POST({ request }) {
  const { userId, userEmail, inventoryData } = await request.json();
  
  if (!userId || !inventoryData) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User ID and inventory data are required'
    }), { status: 400 });
  }

  try {
    // Verify user exists
    const userCheck = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), { status: 404 });
    }

    // Delete user's existing inventory (optional - depends on your needs)
    await query(
      'DELETE FROM inventory_items WHERE user_id = $1',
      [userId]
    );

    // Insert new inventory items
    let insertedCount = 0;
    
    for (const item of inventoryData) {
      const result = await query(
        `INSERT INTO inventory_items (
          user_id, product_type, quality, lot_number, colors, sizes,
          price, material, weight, total_dozens, total_pieces, total_amount,
          in_stock, notes, date_time, unique_code, size_option, added_date_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id`,
        [
          userId,
          item.productType || '',
          item.quality || '',
          item.lotNumber || '',
          JSON.stringify(item.colors || []),
          JSON.stringify(item.sizes || {}),
          item.price || 0,
          item.material || 0,
          item.weight || 0,
          item.totalDozens || 0,
          item.totalPieces || 0,
          item.totalAmount || 0,
          item.inStock !== false,
          item.notes || '',
          item.dateTime || new Date().toISOString(),
          item.code || '',
          item.sizeOption || 'same',
          item.addedDateTime || new Date().toISOString()
        ]
      );
      
      if (result.rows[0].id) {
        insertedCount++;
      }
    }

    console.log(`✅ Inventory saved for user ${userId}: ${insertedCount} items`);

    return new Response(JSON.stringify({
      success: true,
      message: `Data saved successfully (${insertedCount} items)`,
      savedCount: insertedCount,
      savedAt: new Date().toISOString()
    }), { status: 200 });

  } catch (error) {
    console.error('Save data error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save data: ' + error.message
    }), { status: 500 });
  }
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await query(
      `SELECT * FROM inventory_items 
       WHERE user_id = $1 
       ORDER BY date_time DESC, id DESC`,
      [userId]
    );

    // Convert database rows to frontend format
    const inventory = result.rows.map(item => ({
      id: item.id,
      productType: item.product_type,
      quality: item.quality,
      lotNumber: item.lot_number,
      colors: item.colors || [],
      sizes: item.sizes || {},
      price: parseFloat(item.price) || 0,
      material: parseFloat(item.material) || 0,
      weight: parseFloat(item.weight) || 0,
      totalDozens: item.total_dozens || 0,
      totalPieces: item.total_pieces || 0,
      totalAmount: parseFloat(item.total_amount) || 0,
      inStock: item.in_stock !== false,
      notes: item.notes || '',
      dateTime: item.date_time,
      code: item.unique_code,
      sizeOption: item.size_option || 'same',
      addedDateTime: item.added_date_time,
      lastModified: item.last_modified
    }));

    console.log(`✅ Inventory loaded for user ${userId}: ${inventory.length} items`);

    return new Response(JSON.stringify(inventory), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Load data error:', error);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}