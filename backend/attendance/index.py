'''
Business: Управление посещаемостью - сохранение и получение записей
Args: event с httpMethod, body, queryStringParameters, context с request_id
Returns: HTTP response с данными посещаемости
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            month = params.get('month')
            
            if month:
                cursor.execute(
                    'SELECT student_id, date, pair_index, is_present FROM attendance WHERE date LIKE %s ORDER BY date, pair_index',
                    (f'{month}%',)
                )
            else:
                cursor.execute('SELECT student_id, date, pair_index, is_present FROM attendance ORDER BY date, pair_index')
            
            rows = cursor.fetchall()
            
            attendance_map: Dict[str, Dict[str, List[bool]]] = {}
            for row in rows:
                student_id, date, pair_index, is_present = row
                key = f"{student_id}_{date}"
                
                if key not in attendance_map:
                    attendance_map[key] = {
                        'studentId': student_id,
                        'date': date,
                        'pairs': []
                    }
                
                while len(attendance_map[key]['pairs']) <= pair_index:
                    attendance_map[key]['pairs'].append(True)
                
                attendance_map[key]['pairs'][pair_index] = is_present
            
            attendance_list = list(attendance_map.values())
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(attendance_list),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            student_id = body.get('studentId')
            date = body.get('date')
            pair_index = body.get('pairIndex')
            is_present = body.get('isPresent', True)
            
            cursor.execute(
                '''INSERT INTO attendance (student_id, date, pair_index, is_present) 
                   VALUES (%s, %s, %s, %s)
                   ON CONFLICT (student_id, date, pair_index) 
                   DO UPDATE SET is_present = %s''',
                (student_id, date, pair_index, is_present, is_present)
            )
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
