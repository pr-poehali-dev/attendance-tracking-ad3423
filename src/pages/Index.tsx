import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  studentId: string;
  date: string;
  pairs: boolean[];
}

const initialStudents: Student[] = [
  { id: '1', name: 'Иванов Иван' },
  { id: '2', name: 'Петрова Анна' },
  { id: '3', name: 'Сидоров Петр' },
  { id: '4', name: 'Козлова Мария' },
  { id: '5', name: 'Смирнов Алексей' },
];

const Index = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [pairsDialogOpen, setPairsDialogOpen] = useState(false);
  const [totalPairs, setTotalPairs] = useState(1);
  const [pairsStatus, setPairsStatus] = useState<boolean[]>([false, false, false, false, false]);

  const todayStr = format(selectedDate, 'yyyy-MM-dd');

  const openPairsDialog = (studentId: string) => {
    const existing = getAttendanceForDate(studentId, todayStr);
    setSelectedStudent(studentId);
    if (existing) {
      setTotalPairs(existing.pairs.length);
      setPairsStatus(existing.pairs);
    } else {
      setTotalPairs(1);
      setPairsStatus([false, false, false, false, false]);
    }
    setPairsDialogOpen(true);
  };

  const saveAttendance = () => {
    if (selectedStudent) {
      const pairs = pairsStatus.slice(0, totalPairs);
      setAttendance(prev => {
        const existing = prev.find(a => a.studentId === selectedStudent && a.date === todayStr);
        if (existing) {
          return prev.map(a => 
            a.studentId === selectedStudent && a.date === todayStr 
              ? { ...a, pairs } 
              : a
          );
        }
        return [...prev, { studentId: selectedStudent, date: todayStr, pairs }];
      });
      setPairsDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const togglePair = (index: number) => {
    const newStatus = [...pairsStatus];
    newStatus[index] = !newStatus[index];
    setPairsStatus(newStatus);
  };

  const getAttendanceForDate = (studentId: string, date: string) => {
    return attendance.find(a => a.studentId === studentId && a.date === date);
  };

  const addStudent = () => {
    if (newStudentName.trim()) {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: newStudentName.trim()
      };
      setStudents([...students, newStudent]);
      setNewStudentName('');
      setIsAddDialogOpen(false);
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
    setAttendance(attendance.filter(a => a.studentId !== id));
  };

  const getMonthlyStats = (studentId: string) => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    const records = attendance.filter(a => 
      a.studentId === studentId && a.date.startsWith(monthStr)
    );
    
    const totalDays = records.length;
    const totalPairsScheduled = records.reduce((sum, r) => sum + r.pairs.length, 0);
    const totalPairsAttended = records.reduce((sum, r) => sum + r.pairs.filter(p => p).length, 0);
    const missedPairs = totalPairsScheduled - totalPairsAttended;
    const missedHours = missedPairs * 2;
    
    return { totalDays, totalPairsScheduled, totalPairsAttended, missedPairs, missedHours };
  };

  const exportToExcel = () => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    const data = students.map(student => {
      const stats = getMonthlyStats(student.id);
      return {
        'ФИО': student.name,
        'Учебных дней': stats.totalDays,
        'Всего пар': stats.totalPairsScheduled,
        'Посещено пар': stats.totalPairsAttended,
        'Пропущено пар': stats.missedPairs,
        'Пропущено часов': stats.missedHours
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Посещаемость');
    XLSX.writeFile(wb, `Посещаемость_АД3423_${monthStr}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Посещаемость АД3423</h1>
          <p className="text-slate-600">Система учёта посещаемости студентов</p>
        </div>

        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="journal" className="gap-2">
              <Icon name="Calendar" size={16} />
              Журнал
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Icon name="Users" size={16} />
              Студенты
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Icon name="BarChart3" size={16} />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Icon name="FileSpreadsheet" size={16} />
              Экспорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Журнал посещаемости</CardTitle>
                <CardDescription>Выберите дату и отметьте присутствие студентов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      locale={ru}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                      </h3>
                      <p className="text-sm text-blue-700">1 пара = 2 часа</p>
                    </div>

                    <div className="space-y-3">
                      {students.map(student => {
                        const record = getAttendanceForDate(student.id, todayStr);
                        const attended = record ? record.pairs.filter(p => p).length : 0;
                        const total = record ? record.pairs.length : 0;
                        return (
                          <Card key={student.id} className="hover-scale cursor-pointer" onClick={() => openPairsDialog(student.id)}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{student.name}</p>
                                  {record && (
                                    <div className="flex gap-1 mt-1">
                                      {record.pairs.map((present, idx) => (
                                        <div 
                                          key={idx} 
                                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                                            present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                          }`}
                                        >
                                          {idx + 1}
                                        </div>
                                      ))}
                                      <span className="text-sm text-slate-500 ml-2 self-center">
                                        {attended * 2} из {total * 2} ч.
                                      </span>
                                    </div>
                                  )}
                                  {!record && (
                                    <p className="text-sm text-slate-400">Нажмите для отметки</p>
                                  )}
                                </div>
                                
                                {record && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant={attended === total ? 'default' : attended > 0 ? 'outline' : 'destructive'}>
                                      {attended}/{total}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Dialog open={pairsDialogOpen} onOpenChange={setPairsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Отметка посещаемости</DialogTitle>
                  <DialogDescription>
                    {selectedStudent && students.find(s => s.id === selectedStudent)?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label>Сколько пар было в этот день?</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <Button
                          key={num}
                          variant={totalPairs === num ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setTotalPairs(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Отметьте каждую пару</Label>
                    <div className="space-y-2">
                      {Array.from({ length: totalPairs }, (_, i) => i).map(idx => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Пара {idx + 1}</p>
                            <p className="text-xs text-slate-500">2 часа</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={pairsStatus[idx] === true ? 'default' : 'outline'}
                              onClick={() => togglePair(idx)}
                              className={pairsStatus[idx] === true ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              <Icon name="Check" size={16} />
                              <span className="ml-1">Был</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={pairsStatus[idx] === false ? 'destructive' : 'outline'}
                              onClick={() => {
                                const newStatus = [...pairsStatus];
                                newStatus[idx] = false;
                                setPairsStatus(newStatus);
                              }}
                            >
                              <Icon name="X" size={16} />
                              <span className="ml-1">Не было</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-900">Посещено часов:</span>
                      <span className="font-semibold text-blue-900">{pairsStatus.slice(0, totalPairs).filter(p => p).length * 2} из {totalPairs * 2} ч.</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-blue-900">Пропущено:</span>
                      <span className="font-semibold text-red-600">{(totalPairs - pairsStatus.slice(0, totalPairs).filter(p => p).length) * 2} ч.</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPairsDialogOpen(false)}>Отмена</Button>
                  <Button onClick={saveAttendance}>Сохранить</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="students" className="animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Управление студентами</CardTitle>
                    <CardDescription>Добавление и удаление студентов группы</CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Icon name="UserPlus" size={16} />
                        Добавить студента
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Добавить студента</DialogTitle>
                        <DialogDescription>Введите ФИО нового студента</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">ФИО студента</Label>
                          <Input
                            id="name"
                            placeholder="Иванов Иван Иванович"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addStudent()}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={addStudent}>Добавить</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {students.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Icon name="User" size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-500">ID: {student.id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteStudent(student.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Статистика посещаемости</CardTitle>
                    <CardDescription>Отчёт по пропускам за месяц</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Месяц:</Label>
                    <Input
                      type="month"
                      value={format(selectedMonth, 'yyyy-MM')}
                      onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                      className="w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map(student => {
                    const stats = getMonthlyStats(student.id);
                    const attendanceRate = stats.totalPairsScheduled > 0 
                      ? Math.round((stats.totalPairsAttended / stats.totalPairsScheduled) * 100) 
                      : 100;

                    return (
                      <Card key={student.id} className="hover-scale">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-slate-900">{student.name}</h3>
                              <Badge variant={stats.missedHours > 12 ? 'destructive' : stats.missedHours > 4 ? 'outline' : 'default'}>
                                Пропущено: {stats.missedHours} ч.
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Посещаемость</span>
                                <span className="font-medium">{attendanceRate}%</span>
                              </div>
                              <Progress value={attendanceRate} className="h-2" />
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center text-sm">
                              <div className="p-2 bg-slate-50 rounded">
                                <div className="font-semibold text-slate-900">{stats.totalDays}</div>
                                <div className="text-slate-600">Дней</div>
                              </div>
                              <div className="p-2 bg-blue-50 rounded">
                                <div className="font-semibold text-blue-700">{stats.totalPairsScheduled}</div>
                                <div className="text-blue-600">Всего пар</div>
                              </div>
                              <div className="p-2 bg-green-50 rounded">
                                <div className="font-semibold text-green-700">{stats.totalPairsAttended}</div>
                                <div className="text-green-600">Посещено</div>
                              </div>
                              <div className="p-2 bg-red-50 rounded">
                                <div className="font-semibold text-red-700">{stats.missedPairs}</div>
                                <div className="text-red-600">Пропущено</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Экспорт в Excel</CardTitle>
                <CardDescription>Скачайте отчёт по посещаемости за выбранный месяц</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Выберите месяц для экспорта</Label>
                    <Input
                      type="month"
                      value={format(selectedMonth, 'yyyy-MM')}
                      onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                    />
                  </div>
                  <Button onClick={exportToExcel} className="gap-2 mt-7">
                    <Icon name="Download" size={16} />
                    Скачать отчёт
                  </Button>
                </div>

                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Icon name="FileSpreadsheet" size={40} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Что будет в отчёте?</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• ФИО всех студентов группы</li>
                        <li>• Количество учебных дней</li>
                        <li>• Всего пар и посещено пар</li>
                        <li>• Пропущенные пары и часы</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ФИО</TableHead>
                      <TableHead className="text-center">Дней</TableHead>
                      <TableHead className="text-center">Всего пар</TableHead>
                      <TableHead className="text-center">Посещено пар</TableHead>
                      <TableHead className="text-center">Пропущено пар</TableHead>
                      <TableHead className="text-center">Пропущено часов</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => {
                      const stats = getMonthlyStats(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-center">{stats.totalDays}</TableCell>
                          <TableCell className="text-center text-blue-700">{stats.totalPairsScheduled}</TableCell>
                          <TableCell className="text-center text-green-700">{stats.totalPairsAttended}</TableCell>
                          <TableCell className="text-center text-red-700">{stats.missedPairs}</TableCell>
                          <TableCell className="text-center font-semibold">{stats.missedHours}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;