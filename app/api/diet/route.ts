import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day') || '1'; // Di default prende il lunedì (1)

  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        mt.name as meal_name,
        dpi.id as item_id,
        dpi.food_name,
        dpi.quantity_numeric,
        dpi.quantity_unit,
        dpi.is_cheat_meal,
        dpi.kcal,
        dpi.food_category,
        COALESCE(
          json_agg(
            json_build_object(
              'name', fa.food_name,
              'qty', fa.quantity_numeric,
              'unit', fa.quantity_unit
            )
          ) FILTER (WHERE fa.id IS NOT NULL), '[]'
        ) as alternatives
      FROM diet_plan_item dpi
      JOIN meal_type mt ON dpi.meal_type_id = mt.id
      LEFT JOIN food_alternative fa ON dpi.id = fa.diet_plan_item_id
      WHERE dpi.day_id = $1
      GROUP BY mt.id, dpi.id
      ORDER BY mt.sort_order, dpi.id;
    `;
    const result = await client.query(query, [day]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore DB' }, { status: 500 });
  } finally {
    client.release();
  }
}