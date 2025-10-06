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
  const [selectedPairNumber, setSelectedPairNumber] = useState(1);

  const todayStr = format(selectedDate, 'yyyy-MM-dd');

  const toggleStudentAttendance = (studentId: string, pairIndex: number) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId && a.date === todayStr);
      
      if (existing) {
        const newPairs = [...existing.pairs];
        if (newPairs.length <= pairIndex) {
          while (newPairs.length <= pairIndex) {
            newPairs.push(true);
          }
        }
        newPairs[pairIndex] = !newPairs[pairIndex];
        
        return prev.map(a => 
          a.studentId === studentId && a.date === todayStr 
            ? { ...a, pairs: newPairs } 
            : a
        );
      } else {
        const newPairs = Array(5).fill(true);
        newPairs[pairIndex] = false;
        return [...prev, { studentId, date: todayStr, pairs: newPairs }];
      }
    });
  };

  const getStudentPairStatus = (studentId: string, pairIndex: number): boolean => {
    const record = attendance.find(a => a.studentId === studentId && a.date === todayStr);
    if (!record) return true;
    if (!record.pairs[pairIndex]) return true;
    return record.pairs[pairIndex];
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
    
    const allPairs = records.flatMap(r => r.pairs);
    const totalPairsScheduled = allPairs.length;
    const totalPairsAttended = allPairs.filter(p => p).length;
    const missedPairs = totalPairsScheduled - totalPairsAttended;
    const missedHours = missedPairs * 2;
    const totalDays = records.length;
    
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
                  
                  <div className="flex-1 space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                      </h3>
                      <div className="space-y-2">
                        <Label className="text-blue-900">Выберите пару для отметки:</Label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(num => (
                            <Button
                              key={num}
                              variant={selectedPairNumber === num ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => setSelectedPairNumber(num)}
                            >
                              {num} пара
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Пара {selectedPairNumber} - Список группы</CardTitle>
                          <Badge variant="outline">{students.filter(s => getStudentPairStatus(s.id, selectedPairNumber - 1)).length} присутствуют</Badge>
                        </div>
                        <CardDescription>Нажмите на студента чтобы отметить отсутствие</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {students.map((student, index) => {
                            const isPresent = getStudentPairStatus(student.id, selectedPairNumber - 1);
                            return (
                              <div
                                key={student.id}
                                onClick={() => toggleStudentAttendance(student.id, selectedPairNumber - 1)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover-scale ${
                                  isPresent 
                                    ? 'bg-white hover:bg-green-50 border-slate-200' 
                                    : 'bg-red-50 hover:bg-red-100 border-red-200'
                                }`}
                                style={{ animationDelay: `${index * 30}ms` }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                    isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {isPresent ? <Icon name="Check" size={20} /> : <Icon name="X" size={20} />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{student.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {isPresent ? 'Присутствует' : 'Отсутствует'} на {selectedPairNumber} паре
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={isPresent ? 'default' : 'destructive'}>
                                  {isPresent ? '2 ч.' : '0 ч.'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

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